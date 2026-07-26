import { NextResponse } from "next/server";

type ToastIdentity = { guid?: string; multiLocationId?: string };
type ToastItemMap = Record<string, ToastIdentity>;
type StockUpdate = { name: string; status: "IN_STOCK" | "QUANTITY" | "OUT_OF_STOCK"; quantity?: number };

function configuration() {
  const hostname = process.env.TOAST_API_HOSTNAME?.replace(/\/$/, "");
  const clientId = process.env.TOAST_CLIENT_ID;
  const clientSecret = process.env.TOAST_CLIENT_SECRET;
  const restaurantGuid = process.env.TOAST_RESTAURANT_GUID;
  let itemMap: ToastItemMap = {};
  try { itemMap = JSON.parse(process.env.TOAST_ITEM_MAP_JSON || "{}"); } catch {}
  const required: Array<[string, unknown]> = [
    ["TOAST_API_HOSTNAME", hostname],
    ["TOAST_CLIENT_ID", clientId],
    ["TOAST_CLIENT_SECRET", clientSecret],
    ["TOAST_RESTAURANT_GUID", restaurantGuid],
    ["TOAST_ITEM_MAP_JSON", Object.keys(itemMap).length ? "configured" : ""],
  ];
  const missing = required.filter(([,value])=>!value).map(([key])=>key);
  return { hostname, clientId, clientSecret, restaurantGuid, itemMap, missing };
}

async function accessToken(config: ReturnType<typeof configuration>) {
  const response = await fetch(`${config.hostname}/authentication/v1/authentication/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: config.clientId, clientSecret: config.clientSecret, userAccessType: "TOAST_MACHINE_CLIENT" }),
    cache: "no-store",
  });
  const data = await response.json().catch(()=>({}));
  if (!response.ok || !data?.token?.accessToken) throw new Error(data?.message || "Toast authentication failed");
  return data.token.accessToken as string;
}

function unavailable(missing: string[]) {
  return NextResponse.json({ configured:false, error:"Toast Stock is ready but not yet connected.", missing }, { status:503 });
}

export async function GET() {
  const config = configuration();
  if (config.missing.length) return unavailable(config.missing);
  try {
    const token = await accessToken(config);
    const identities = Object.values(config.itemMap);
    const response = await fetch(`${config.hostname}/stock/v1/inventory/search`, {
      method: "POST",
      headers: { "Authorization":`Bearer ${token}`, "Toast-Restaurant-External-ID":config.restaurantGuid!, "Content-Type":"application/json" },
      body: JSON.stringify({ guids:identities.flatMap(x=>x.guid?[x.guid]:[]), multiLocationIds:identities.flatMap(x=>x.multiLocationId?[x.multiLocationId]:[]) }),
      cache: "no-store",
    });
    const inventory = await response.json().catch(()=>[]);
    if (!response.ok) return NextResponse.json({ error:"Toast Stock read failed", detail:inventory }, { status:response.status });
    const names = new Map(Object.entries(config.itemMap).flatMap(([name,id])=>[[id.guid,name],[id.multiLocationId,name]].filter((x):x is [string,string]=>Boolean(x[0]))));
    const items = inventory.map((item:ToastIdentity & {status:string;quantity:number|null})=>({...item,name:names.get(item.guid||"")||names.get(item.multiLocationId||"")||"Toast menu item"}));
    return NextResponse.json({ configured:true, items });
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error?error.message:"Toast Stock read failed" }, { status:502 });
  }
}

export async function PUT(request: Request) {
  const config = configuration();
  if (config.missing.length) return unavailable(config.missing);
  try {
    const body = await request.json();
    const updates: StockUpdate[] = Array.isArray(body?.items) ? body.items : [];
    if (!updates.length) return NextResponse.json({ error:"At least one inventory update is required." }, { status:400 });
    const payload = updates.map(update=>{
      const identity=config.itemMap[update.name];
      if (!identity) throw new Error(`No Toast item identifier is mapped for ${update.name}`);
      if (update.status==="QUANTITY" && (!Number.isFinite(update.quantity) || Number(update.quantity)<=0)) throw new Error(`A positive quantity is required for ${update.name}`);
      return {...identity,status:update.status,...(update.status==="QUANTITY"?{quantity:Number(update.quantity)}:{})};
    });
    const token = await accessToken(config);
    const response = await fetch(`${config.hostname}/stock/v1/inventory/update`, {
      method:"PUT",
      headers:{ "Authorization":`Bearer ${token}`, "Toast-Restaurant-External-ID":config.restaurantGuid!, "Content-Type":"application/json" },
      body:JSON.stringify(payload),
      cache:"no-store",
    });
    const result=await response.json().catch(()=>[]);
    if(!response.ok)return NextResponse.json({error:"Toast Stock update failed",detail:result},{status:response.status});
    return NextResponse.json({configured:true,items:result});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Toast Stock update failed"},{status:400});
  }
}
