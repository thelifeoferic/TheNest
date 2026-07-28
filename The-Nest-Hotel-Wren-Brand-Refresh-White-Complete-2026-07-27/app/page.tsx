"use client";

import { useEffect, useMemo, useState } from "react";

type View = "Today" | "Team" | "Property" | "Housekeeping" | "Guests" | "Maintenance" | "Inventory" | "Financials" | "Promotions" | "Knowledge" | "Resources";

const nav: { label: View; glyph: string }[] = [
  { label: "Today", glyph: "⌂" }, { label: "Team", glyph: "◌" }, { label: "Property", glyph: "□" }, { label: "Housekeeping", glyph: "◇" },
  { label: "Guests", glyph: "○" }, { label: "Maintenance", glyph: "△" }, { label: "Inventory", glyph: "▦" },
  { label: "Financials", glyph: "↗" }, { label: "Promotions", glyph: "%" }, { label: "Knowledge", glyph: "≡" },
  { label: "Resources", glyph: "▤" },
];

const rooms = [
  ["01", "Sunset Deluxe King", "occupied"], ["02", "Sunset Deluxe King", "departing"], ["03", "Sunset Deluxe King", "dirty"],
  ["04", "Sunset Deluxe King", "clean"], ["05", "Sunset Deluxe King", "arriving"], ["06", "Sunset Deluxe King", "clean"],
  ["07", "Sunrise King", "occupied"], ["08", "Sunrise King", "inspect"], ["09", "Sunrise Double Queen", "blocked"],
  ["10", "Sunrise King", "occupied"], ["11", "Sunrise King", "arriving"], ["12", "ADA Sunrise Double Queen", "clean"],
];
const wrenHouse = ["WH", "Wren House", "clean"];
type RoomCondition = "clean" | "dirty" | "inspect" | "blocked";
const roomConditionLabels:Record<RoomCondition,string>={clean:"Clean",dirty:"Dirty",inspect:"Needs inspection",blocked:"Out of order"};
const initialRoomConditions:Record<string,RoomCondition>={"01":"clean","02":"dirty","03":"dirty","04":"clean","05":"inspect","06":"clean","07":"clean","08":"inspect","09":"blocked","10":"clean","11":"inspect","12":"clean","WH":"clean"};
function storedValue<T>(key:string,fallback:T):T { if(typeof window==="undefined")return fallback;try{const saved=window.localStorage.getItem(key);return saved?JSON.parse(saved):fallback}catch{return fallback} }
function localDateKey(date=new Date()){const local=new Date(date.getTime()-date.getTimezoneOffset()*60_000);return local.toISOString().slice(0,10)}
function dateFromKey(key:string){const [year,month,day]=key.split("-").map(Number);return new Date(year,month-1,day,12)}
function moveDateKey(key:string,days:number){const date=dateFromKey(key);date.setDate(date.getDate()+days);return localDateKey(date)}
function formatOperationalDate(key:string){return new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(dateFromKey(key))}
function formatOperationalTime(value:string){return new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit"}).format(new Date(value))}
function downloadText(filename:string,contents:string,mime="text/csv;charset=utf-8"){
  const url=URL.createObjectURL(new Blob([contents],{type:mime}));
  const link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}

const roomDescriptions:Record<string,string>={"Sunset Deluxe King":"450 sq ft · King bed · Shower/tub combo · Kitchenette · West-facing desert gate · Private fireplace patio · Sleeps 2 · Select rooms pet-friendly","Sunrise King":"450 sq ft · King bed · Walk-in shower · Kitchenette · Private fireplace patio · Sleeps 2 · Select rooms pet-friendly","Sunrise Double Queen":"450 sq ft · Two queen beds · Walk-in shower · Kitchenette · Private fireplace patio · Sleeps up to 4","ADA Sunrise Double Queen":"450 sq ft · Two queen beds · Roll-in shower · Accessible kitchenette and vanity · Private fireplace patio · Sleeps up to 4 · Pet-friendly","Wren House":"Two bedrooms · Two baths · Full kitchen · Living and dining rooms · Private desert patio · Pinto Mountain views · Available by request for select stays and gatherings"};
const localGuide={"EAT & DRINK":["La Copine · Yucca Valley","Luna Bakery · Yucca Valley","Mas o Menos · Joshua Tree","GRND SQRL · 29 Palms","The Copper Room · Yucca Valley","29 Palms Inn · 29 Palms","Kitchen in the Desert · 29 Palms","The Tiny Pony Tavern · Yucca Valley","Desierto Alto · Yucca Valley","Giant Rock Meeting Room · Yucca Valley"],"TO DO":["High Desert Test Sites · Joshua Tree","Old Schoolhouse Museum · 29 Palms","Compound · Yucca Valley","The Integratron · Homestead Valley","Noah Purifoy Outdoor Desert Art Museum · Joshua Tree","Institute of Mentalphysics · Joshua Tree"],"NATURE":["Jumbo Rocks Campground · Joshua Tree NP","Indian Cove Campground · 29 Palms","Cholla Cactus Garden · Joshua Tree NP","Amboy Crater · Mojave Trails","Willow Hole · Joshua Tree NP","Big Morongo Canyon Preserve · Yucca Valley"]};
const diningGuide=[
  {name:"La Copine",place:"Flamingo Heights",phone:"(760) 289-8537",tel:"7602898537",url:"sms:7602898537",action:"Text for a table",detail:"Destination dining with a fiercely seasonal menu and an unmistakably desert point of view. Reservations open four weeks ahead by text; walk-ins are welcome, but waits can be long."},
  {name:"Luna Bakery",place:"Yucca Valley",phone:"(442) 599-5444",tel:"4425995444",url:"https://lunasourdough.com/",action:"Visit website",detail:"Small-batch organic sourdough, laminated pastries and excellent sandwiches. First come, first served—go early and check the bake schedule before sending guests."},
  {name:"Más o Menos",place:"Joshua Tree",phone:"(442) 370-2266",tel:"4423702266",url:"https://masomenosjt.com/",action:"Visit website",detail:"Easygoing coffee bar by day and cocktail-and-wine hangout by night, with a spacious patio, rotating food pop-ups and regular community events."},
  {name:"GRND SQRL",place:"Twentynine Palms",phone:"(760) 800-1275",tel:"7608001275",url:"https://www.opentable.com/r/grnd-sqrl-twentynine-palms",action:"Reserve a table",detail:"A lively downtown gastropub for scratch-made comfort food, a standout burger and one of the desert’s strongest craft-beer lists."},
  {name:"The Copper Room",place:"Yucca Valley",phone:"(760) 228-0607",tel:"7602280607",url:"https://www.opentable.com/r/the-copper-room-yucca-valley",action:"Reserve a table",detail:"A restored 1957 airport restaurant and cocktail lounge overlooking the runway. Best for a polished dinner, golden-hour drinks or live music."},
  {name:"29 Palms Inn",place:"Twentynine Palms",phone:"(760) 367-3505",tel:"7603673505",url:"https://www.29palmsinn.com/",action:"Visit website",detail:"Historic oasis dining with an old-desert atmosphere, garden-grown ingredients and live music on select evenings. Call ahead for dinner reservations."},
  {name:"Kitchen in the Desert",place:"Twentynine Palms",phone:"(760) 865-0245",tel:"7608650245",url:"https://www.kitd29.com/reservations",action:"Reserve a table",detail:"Caribbean-influenced New American cooking on a cactus-filled outdoor patio. A strong choice for brunch, cocktails or a celebratory dinner; seating is outdoors."},
  {name:"The Tiny Pony Tavern",place:"Yucca Valley",phone:"(442) 205-0163",tel:"4422050163",url:"https://www.thetinypony.com/",action:"Visit website",detail:"Art-filled neighborhood tavern with a late-night scratch kitchen, proper Guinness, cocktails, brunch and a dog-friendly backyard. Fun rather than formal."},
  {name:"Desierto Alto",place:"Yucca Valley",phone:"(760) 820-1063",tel:"7608201063",url:"https://www.desiertoalto.com/",action:"Visit website",detail:"A beautifully curated wine, mezcal and provisions shop with Counter Culture coffee, pastries, cheese and charcuterie—ideal for stocking a guest’s patio."},
  {name:"Giant Rock Meeting Room",place:"Flamingo Heights",phone:"(442) 272-1472",tel:"4422721472",url:"https://www.giantrockmeetingroom.com/",action:"Visit website",detail:"Welcoming desert watering hole for pizza, cocktails, sunset patio time and live music. Check the event calendar; table service is generally walk-in."},
];

const tasks = [
  { room: "03", type: "Checkout clean", time: "45 min", note: "Allergen-free linen set", priority: "First" },
  { room: "08", type: "Final inspection", time: "10 min", note: "Check patio glassware", priority: "Next" },
  { room: "05", type: "Arrival refresh", time: "20 min", note: "Anniversary setup · 2:30 ETA", priority: "2:00" },
];

type TicketStatus="Open"|"In progress"|"Verify"|"Recently completed";
type MaintenanceTicket={id:string;location:string;issue:string;priority:string;guestImpact:string;assignedTo:string;status:TicketStatus;createdAt:string;updatedAt:string};
const initialMaintenanceTickets:MaintenanceTicket[]=[
  {id:"WO-101",location:"Pool",issue:"Heater cycling slowly",priority:"Medium",guestImpact:"Minor",assignedTo:"Sam · Maintenance",status:"Open",createdAt:"2026-07-12T08:10:00-07:00",updatedAt:"2026-07-12T08:10:00-07:00"},
  {id:"WO-102",location:"Room 03",issue:"Patio latch catches",priority:"Low",guestImpact:"None",assignedTo:"General Manager",status:"Open",createdAt:"2026-07-12T09:05:00-07:00",updatedAt:"2026-07-12T09:05:00-07:00"},
  {id:"WO-103",location:"Garden",issue:"Path light intermittent",priority:"Low",guestImpact:"Minor",assignedTo:"Approved vendor",status:"Open",createdAt:"2026-07-12T09:20:00-07:00",updatedAt:"2026-07-12T09:20:00-07:00"},
  {id:"WO-104",location:"Room 09",issue:"HVAC compressor",priority:"High",guestImpact:"Significant",assignedTo:"Sam · Maintenance",status:"In progress",createdAt:"2026-07-11T16:45:00-07:00",updatedAt:"2026-07-12T10:18:00-07:00"},
  {id:"WO-105",location:"Windsong",issue:"Service sink drip",priority:"Medium",guestImpact:"None",assignedTo:"Approved vendor",status:"In progress",createdAt:"2026-07-11T14:00:00-07:00",updatedAt:"2026-07-12T09:42:00-07:00"},
  {id:"WO-106",location:"Room 06",issue:"Replaced bedside outlet",priority:"Medium",guestImpact:"Minor",assignedTo:"Sam · Maintenance",status:"Verify",createdAt:"2026-07-11T11:00:00-07:00",updatedAt:"2026-07-12T11:22:00-07:00"},
  {id:"WO-098",location:"Pool",issue:"Recalibrated salt sensor",priority:"Medium",guestImpact:"Minor",assignedTo:"Sam · Maintenance",status:"Recently completed",createdAt:"2026-07-10T10:00:00-07:00",updatedAt:"2026-07-12T10:42:00-07:00"},
  {id:"WO-097",location:"Room 02",issue:"Reset patio fireplace",priority:"Low",guestImpact:"Minor",assignedTo:"Eliana Mullins",status:"Recently completed",createdAt:"2026-07-10T09:00:00-07:00",updatedAt:"2026-07-11T16:10:00-07:00"},
  {id:"WO-094",location:"Wren House",issue:"Kitchen faucet cartridge",priority:"Medium",guestImpact:"None",assignedTo:"Approved vendor",status:"Recently completed",createdAt:"2026-07-08T08:30:00-07:00",updatedAt:"2026-07-10T13:18:00-07:00"},
];

type Employee = { name:string; role:string; shift:string; zone:string; tone:string; status:"On property"|"Later today"|"Off today" };
const employeeRoster: Employee[] = [
  {name:"Jane Rozhda",role:"Guest Experience Lead",shift:"7:00 AM – 3:00 PM",zone:"Daily lead · lobby",tone:"lead",status:"On property"},
  {name:"Emilee Mae",role:"Guest Experience",shift:"8:00 AM – 4:30 PM",zone:"Lobby · arrivals",tone:"guest",status:"On property"},
  {name:"Eliana Mullins",role:"Housekeeping",shift:"8:00 AM – 4:00 PM",zone:"Rooms 01–06",tone:"rooms",status:"On property"},
  {name:"Delmara Garule",role:"Housekeeping",shift:"9:00 AM – 5:00 PM",zone:"Rooms 07–12",tone:"rooms",status:"On property"},
  {name:"Dana Ohaver",role:"Property Care",shift:"9:30 AM – 6:00 PM",zone:"Pool · property",tone:"care",status:"On property"},
  {name:"Shamu Azizam",role:"Windsong",shift:"3:30 PM – 9:00 PM",zone:"Retail · lobby",tone:"retail",status:"Later today"},
  {name:"Hannah Harding",role:"Guest Experience",shift:"Off today",zone:"Next shift · Monday",tone:"guest",status:"Off today"},
  {name:"Meghan Topazio",role:"Guest Experience",shift:"Off today",zone:"Next shift · Tuesday",tone:"guest",status:"Off today"},
];

const roomDesign: Record<string, [string, string, string]> = {
  "01":["Hand-painted sunrise field tile with an irregular ochre border","Original desert study in charcoal and mineral pigment","Turned-oak globe sconce with warm 2200K lamp"],
  "02":["Hand-painted clay tile in a crisp midday grid","Geometric work on paper from a Hi-Desert maker","Blackened-brass reading light with linen shade"],
  "03":["Deep umber shower tile with hand-brushed star details","Small nocturne inspired by the Pinto Mountains","Low amber ceramic bedside sconces"],
  "04":["Soft sand botanical tile, painted and sealed by hand","Quiet landscape study in pale earth pigments","Carved wood wall light with opal globe"],
  "05":["Sun-washed terracotta tile with linear brushwork","Modern desert abstraction in rust and cream","Slim bronze task lights and shaded patio lantern"],
  "06":["Saturated plum-brown tile with scattered night marks","Original ink drawing of cholla at dusk","Hand-thrown ceramic sconces with amber light"],
  "07":["Pale apricot tile with a loose sunrise wash","Graphite study of the north garden","White oak and milk-glass bedside fixtures"],
  "08":["Ochre tile with hand-painted vertical rhythm","Found desert textile framed as artwork","Patinated brass cone sconces"],
  "09":["Night-sky tile in umber and muted indigo","Paired abstract works above the queen beds","Twin ceramic globe lights with dim-to-warm lamps"],
  "10":["Golden clay tile with crisp hand-drawn lines","Bold geometric composition in adobe tones","Blackened steel swing-arm reading lights"],
  "11":["Smoky brown tile with star-like brush marks","Moody desert photograph printed on warm paper","Low terracotta sconces and indirect cove light"],
  "12":["Low-contrast sand tile with an accessible tactile edge","Soft botanical study positioned for seated viewing","Accessible-height opal sconces with glare-free light"],
  "WH":["Custom oak millwork, original stone and carefully restored terracotta floors","Original and collected works layered with sculptural objects throughout the house","Warm brass sconces, Noguchi-style pendants and low, atmospheric lamps"],
};

type GuestProfile = {
  id:string; name:string; initials:string; room:string; roomType:string; status:"Arriving"|"In house"|"Departing";
  arrival:string; departure:string; eta:string; nights:number; party:string; confirmation:string; source:string;
  ratePlan:string; nightly:string; total:string; balance:string; email:string; phone:string; tags:string[];
  preferences:string[]; notes:string[]; history:string; timeline:[string,string][];
};

const guestProfiles: GuestProfile[] = [
  {id:"maya-calder",name:"Maya & Theo Calder",initials:"MC",room:"05",roomType:"Sunset Deluxe King",status:"Arriving",arrival:"Jul 12, 2026",departure:"Jul 15, 2026",eta:"2:30 PM",nights:3,party:"2 adults",confirmation:"MW-582143",source:"Hotel Wren direct",ratePlan:"Settle into Summer",nightly:"$0",total:"$0",balance:"$0",email:"maya.calder@example.com",phone:"(323) 555-0142",tags:["Returning","Anniversary"],preferences:["Bellocq tea","Quiet room","Late checkout requested"],notes:["Anniversary trip—welcome card from Eric.","Patio lantern and fireplace check before arrival."],history:"2nd stay · Last visit November 2025",timeline:[["Today · 12:06 PM","Pre-arrival note delivered"],["Today · 9:14 AM","ETA confirmed for 2:30 PM"],["Jun 22","Reservation modified · late checkout added"]]},
  {id:"nora-bennett",name:"Nora Bennett",initials:"NB",room:"11",roomType:"Sunrise King",status:"Arriving",arrival:"Jul 12, 2026",departure:"Jul 14, 2026",eta:"5:15 PM",nights:2,party:"1 adult",confirmation:"MW-582291",source:"Hotel Wren direct",ratePlan:"Best Available",nightly:"$0",total:"$0",balance:"$0",email:"nora.bennett@example.com",phone:"(415) 555-0198",tags:["First stay","Late arrival"],preferences:["Decaf coffee","Text messages"],notes:["Share after-dark arrival path and parking note.","No housekeeping refresh on July 13."],history:"First Hotel Wren stay",timeline:[["Today · 11:22 AM","Late-arrival note queued"],["Jul 10","Mobile check-in completed"],["Jun 28","Reservation confirmed"]]},
  {id:"amelia-chen",name:"Amelia Chen",initials:"AC",room:"01",roomType:"Sunset Deluxe King",status:"In house",arrival:"Jul 11, 2026",departure:"Jul 14, 2026",eta:"Checked in",nights:3,party:"2 adults",confirmation:"MW-581977",source:"Mr & Mrs Smith",ratePlan:"Partner Flexible",nightly:"$0",total:"$0",balance:"$0",email:"amelia.chen@example.com",phone:"(310) 555-0185",tags:["In house","No service today"],preferences:["Extra pool towels","Oat milk"],notes:["Requested pool towels for 3:00 PM.","Prefers messages rather than calls."],history:"First Hotel Wren stay",timeline:[["Today · 12:28 PM","Pool towel request acknowledged"],["Yesterday · 4:02 PM","Checked in · Room 01"],["Yesterday · 3:48 PM","Room ready message delivered"]]},
  {id:"shah",name:"Daniel & Priya Shah",initials:"DS",room:"10",roomType:"Sunrise King",status:"In house",arrival:"Jul 10, 2026",departure:"Jul 14, 2026",eta:"Checked in",nights:4,party:"2 adults",confirmation:"MW-581824",source:"Hotel Wren direct",ratePlan:"Best Available",nightly:"$0",total:"$0",balance:"$0",email:"priya.shah@example.com",phone:"(213) 555-0119",tags:["In house","Celebration"],preferences:["Vegetarian dining","Minimal room entry"],notes:["Send a quiet dinner recommendation for tonight.","Celebrating a new studio opening."],history:"3rd stay · Returning guest",timeline:[["Today · 12:34 PM","Local dining request acknowledged"],["Jul 10 · 3:31 PM","Checked in · Room 10"],["May 18","Returning-guest profile matched"]]},
  {id:"eli-morgan",name:"Eli Morgan",initials:"EM",room:"07",roomType:"Sunrise King",status:"In house",arrival:"Jul 11, 2026",departure:"Jul 13, 2026",eta:"Checked in",nights:2,party:"1 adult",confirmation:"MW-582018",source:"Booking.com",ratePlan:"OTA Standard",nightly:"$0",total:"$0",balance:"$0",email:"relay-guest@example.com",phone:"(760) 555-0107",tags:["In house","OTA email"],preferences:["Meditation blanket"],notes:["Extra meditation blanket in progress."],history:"First Hotel Wren stay",timeline:[["Today · 12:16 PM","Meditation blanket assigned to Jordan"],["Yesterday · 5:06 PM","Checked in · Room 07"],["Jul 2","Reservation imported from channel"]]},
  {id:"rowan-lee",name:"Rowan Lee",initials:"RL",room:"02",roomType:"Sunset Deluxe King",status:"Departing",arrival:"Jul 9, 2026",departure:"Jul 12, 2026",eta:"11:00 AM",nights:3,party:"2 adults",confirmation:"MW-581630",source:"Hotel Wren direct",ratePlan:"Best Available",nightly:"$0",total:"$0",balance:"$0",email:"rowan.lee@example.com",phone:"(917) 555-0174",tags:["Departing","Marketing opt-in"],preferences:["Canyon Coffee"],notes:["Offer luggage hold until 2:00 PM.","Invited to join the Wren list."],history:"2nd stay · Last visit February 2026",timeline:[["Today · 10:44 AM","Digital folio delivered"],["Today · 9:02 AM","Checkout reminder viewed"],["Jul 9 · 2:51 PM","Checked in · Room 02"]]},
];

function StatusDot({ kind }: { kind: string }) { return <span className={`status-dot ${kind}`} aria-hidden="true" />; }

export default function Home() {
  const [signedIn, setSignedIn] = useState(false);
  const [portal, setPortal] = useState("Wren Family");
  const [role, setRole] = useState("General Manager");
  const [view, setView] = useState<View>("Today");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [workOrderOpen, setWorkOrderOpen] = useState(false);
  const [stockCountOpen, setStockCountOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(0);
  const [toast, setToast] = useState("");
  const [guestRequests, setGuestRequests] = useState<string[]>(()=>storedValue("nest-guest-requests",[]));
  const [shopOrders,setShopOrders]=useState<string[]>(()=>{const saved=storedValue<unknown>("nest-shop-orders",[]);return Array.isArray(saved)?saved.map(String):Array(Number(saved)||0).fill("Two Deserts Soap")});
  const [maintenanceTickets,setMaintenanceTickets]=useState<MaintenanceTicket[]>(()=>storedValue("nest-maintenance-tickets",initialMaintenanceTickets));
  const [handledAlerts,setHandledAlerts]=useState<string[]>(()=>storedValue("nest-handled-alerts",[]));
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [weather, setWeather] = useState({temperature:"—",condition:"Loading",high:"—",low:"—"});
  const [taskChecklists,setTaskChecklists]=useState<Record<string,boolean[]>>(()=>storedValue("nest-room-task-checklists",{"03":[true,true,false,false,false,false],"08":[false,false,false,false,false,false],"05":[false,false,false,false,false,false]}));
  const [roomConditions,setRoomConditions]=useState<Record<string,RoomCondition>>(()=>({...initialRoomConditions,...storedValue("nest-room-conditions",{})}));
  const room = useMemo(() => selectedRoom === "WH" ? wrenHouse : rooms.find(r => r[0] === selectedRoom), [selectedRoom]);
  const design = selectedRoom ? roomDesign[selectedRoom] : null;
  const guest = useMemo(() => guestProfiles.find(g => g.id === selectedGuest) || null, [selectedGuest]);
  const displayName = role === "Owner" ? "Jessica" : role === "Consultant" ? "Melvin" : role === "General Manager" ? "Eric" : "Alex";
  const initials = displayName.slice(0,2).toUpperCase();
  const alertIds=[...guestRequests.map(x=>`guest-${encodeURIComponent(x)}`),...(shopOrders.length?[`windsong-order-${shopOrders.length}`]:[]),"inspect","inventory","maintenance"];
  const openAlertCount=alertIds.filter(id=>!handledAlerts.includes(id)).length;

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  useEffect(()=>{const conditions:Record<number,string>={0:"Clear",1:"Mostly clear",2:"Partly cloudy",3:"Cloudy",45:"Fog",48:"Fog",51:"Drizzle",53:"Drizzle",55:"Drizzle",61:"Rain",63:"Rain",65:"Rain",71:"Snow",80:"Showers",81:"Showers",82:"Showers",95:"Thunderstorms"};fetch("https://api.open-meteo.com/v1/forecast?latitude=34.1356&longitude=-116.0542&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles").then(r=>r.json()).then(data=>setWeather({temperature:Math.round(data.current.temperature_2m).toString(),condition:conditions[data.current.weather_code]||"Current",high:Math.round(data.daily.temperature_2m_max[0]).toString(),low:Math.round(data.daily.temperature_2m_min[0]).toString()})).catch(()=>setWeather({temperature:"—",condition:"Unavailable",high:"—",low:"—"}))},[]);
  useEffect(()=>{window.localStorage.setItem("nest-room-conditions",JSON.stringify(roomConditions))},[roomConditions]);
  useEffect(()=>{window.localStorage.setItem("nest-guest-requests",JSON.stringify(guestRequests))},[guestRequests]);
  useEffect(()=>{window.localStorage.setItem("nest-shop-orders",JSON.stringify(shopOrders))},[shopOrders]);
  useEffect(()=>{window.localStorage.setItem("nest-maintenance-tickets",JSON.stringify(maintenanceTickets))},[maintenanceTickets]);
  useEffect(()=>{window.localStorage.setItem("nest-handled-alerts",JSON.stringify(handledAlerts))},[handledAlerts]);
  useEffect(()=>{window.localStorage.setItem("nest-room-task-checklists",JSON.stringify(taskChecklists))},[taskChecklists]);

  if (!signedIn) return (
    <main className="login-shell">
      <section className="login-art" aria-label="Hotel Wren lobby">
        <img className="login-photo" src="/hotel-wren-lobby.png" alt="Hotel Wren’s warm, botanical lobby" />
        <img className="login-seal" src="/hotel-wren-seal-transparent.png" alt="Hotel Wren · Twentynine Palms, California" />
        <div className="login-mark"><h1>The<br />Nest</h1><p>A calmer way to spend the day.</p><small>BY HOTEL WREN</small></div>
      </section>
      <section className="login-panel">
        <div className="login-brand"><img className="login-wordmark" src="/hotel-wren-wordmark-transparent.png" alt="Hotel Wren" /><div className="nest-lockup"><strong>The Nest</strong><em>A calmer way to spend the day.</em><small>PRIVATE HOTEL PORTAL</small></div></div>
        <div className="login-copy"><p className="eyebrow">PRIVATE HOTEL PORTAL</p><h2>Welcome back.</h2>
          <label>Enter as<select value={portal} onChange={e => setPortal(e.target.value)}><option>Wren Family</option><option>Wren Guests</option></select></label>
          {portal==="Wren Family"&&<label>Demo position<select value={role} onChange={e => setRole(e.target.value)}>{["General Manager","Owner","Consultant","Guest Experience","Housekeeping Manager","Housekeeper","Maintenance","Accounting","Vendor"].map(x => <option key={x}>{x}</option>)}</select></label>}
          <button className="primary" onClick={() => { setView("Today"); setSignedIn(true); }}>Enter {portal} <span>→</span></button>
          <p className="privacy">Private operational workspace · Hotel Wren</p>
        </div>
      </section>
    </main>
  );

  if(portal==="Wren Guests") return <GuestPortalV2 weather={weather} requests={guestRequests} submitRequest={request=>setGuestRequests(x=>[request,...x])} orderProduct={product=>setShopOrders(x=>[product,...x])} signOut={()=>setSignedIn(false)} />;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="side-brand-identity"><img className="side-roundel" src="/hotel-wren-seal-transparent.png" alt="Hotel Wren" /><div className="nest-lockup side-brand"><strong>The Nest</strong><em>A calmer way to spend the day.</em><small>BY HOTEL WREN</small></div></div>
        <nav aria-label="Main navigation">{nav.map(n => <button key={n.label} className={view === n.label ? "active" : ""} onClick={() => setView(n.label)}><span>{n.glyph}</span>{n.label}</button>)}</nav>
        <div className="side-foot"><div className="avatar">{initials}</div><div><strong>{displayName}</strong><small>{role}</small></div><button aria-label="Sign out" onClick={() => setSignedIn(false)}>•••</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><button className="mobile-menu" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><img src="/hotel-wren-seal-transparent.png" alt="" /></button><div className="demo-label"><i /> HOTEL WREN · THE NEST</div><div className="top-actions"><span className="property-pulse">12 rooms · 5 team on property</span><button className="bell" aria-label="Open alerts" onClick={() => setAlertsOpen(true)}>♢<em>{openAlertCount}</em></button><button className="weather" onClick={()=>notify("Live weather for Twentynine Palms · Open-Meteo")}>{weather.temperature}° <small>{weather.condition}</small></button></div></header>

        <div className="content">
          {view === "Today" && <Today name={displayName} guestRequestCount={guestRequests.length} conditions={roomConditions} onRoom={setSelectedRoom} onGuest={setSelectedGuest} onView={setView} notify={notify} />}
          {view === "Team" && <Team notify={notify} />}
          {view === "Property" && <Property conditions={roomConditions} onRoom={setSelectedRoom} />}
          {view === "Housekeeping" && <Housekeeping checklist={taskChecklists[tasks[activeTask].room]||Array(6).fill(false)} setChecklist={values=>setTaskChecklists(items=>({...items,[tasks[activeTask].room]:values}))} notify={notify} activeTask={activeTask} setActiveTask={setActiveTask} openWorkOrder={()=>setWorkOrderOpen(true)} updateRoom={(room,status)=>setRoomConditions(items=>({...items,[room]:status}))} />}
          {view === "Guests" && <Guests notify={notify} guestRequests={guestRequests} createRequest={request=>setGuestRequests(items=>[request,...items])} onGuest={setSelectedGuest} />}
          {view === "Maintenance" && <Maintenance tickets={maintenanceTickets} notify={notify} openWorkOrder={() => setWorkOrderOpen(true)} updateTicket={(id,status)=>setMaintenanceTickets(items=>items.map(ticket=>ticket.id===id?{...ticket,status,updatedAt:new Date().toISOString()}:ticket))} />}
          {view === "Inventory" && <InventoryV2 role={role} shopOrders={shopOrders} notify={notify} openStockCount={() => setStockCountOpen(true)} />}
          {view === "Financials" && <Financials />}
          {view === "Promotions" && <Promotions notify={notify} />}
          {view === "Knowledge" && <Knowledge />}
          {view === "Resources" && <Resources onView={setView} />}
        </div>
      </section>

      {room && design && <div className="drawer-backdrop" onClick={() => setSelectedRoom(null)}><aside className={`room-drawer ${room[0]==="WH"?"house-drawer":""}`} onClick={e => e.stopPropagation()}><button className="close" onClick={() => setSelectedRoom(null)}>×</button><p className="eyebrow">{room[0]==="WH"?"PRIVATE RESIDENCE":"ROOM "+room[0]}</p><h2>{room[1]}</h2>{room[0]==="WH"?<div className="house-gallery"><img src="/wren-house-living-room.jpg" alt="Wren House living room"/><img src="/wren-house-kitchen.jpg" alt="Wren House kitchen"/><img src="/wren-house-dining.jpg" alt="Wren House dining room"/><img src="/wren-house-bedroom.jpg" alt="Wren House bedroom"/><img src="/wren-house-bath.jpg" alt="Wren House bath and vanity"/><img src="/wren-house-patio.jpg" alt="Wren House private desert patio"/></div>:room[1]==="Sunset Deluxe King"?<div className="room-gallery"><img src="/sunset-deluxe-bedroom-1.png" alt="Sunset Deluxe King bedroom"/><img src="/sunset-deluxe-kitchenette.png" alt="Sunset Deluxe King kitchenette"/><img src="/sunset-deluxe-bath.png" alt="Sunset Deluxe King bath"/><img src="/sunset-deluxe-patio.png" alt="Sunset Deluxe King patio"/></div>:room[1]==="Sunrise King"?<div className="sunrise-gallery">{[1,2,3,4,5,6].map(i=><img key={i} src={`/sunrise-king-${i}.jpg`} alt={`Sunrise King detail ${i}`}/>)}</div>:<div className="room-hero"><span>DESERT GARDEN</span></div>}<div className="room-type-copy">{roomDescriptions[room[1]]}</div><div className="drawer-status"><StatusDot kind={roomConditions[room[0]]} /><div><strong>{roomConditionLabels[roomConditions[room[0]]]}</strong><small>Digital room status · updates immediately</small></div></div><section className="room-status-picker"><p className="eyebrow">CHANGE ROOM STATUS</p><div>{(Object.keys(roomConditionLabels) as RoomCondition[]).map(status=><button key={status} className={roomConditions[room[0]]===status?"active":""} onClick={()=>{setRoomConditions({...roomConditions,[room[0]]:status});notify(`${room[0]==="WH"?"Wren House":`Room ${room[0]}`} marked ${roomConditionLabels[status].toLowerCase()}`)}}><StatusDot kind={status}/>{roomConditionLabels[status]}</button>)}</div></section><dl><div><dt>{room[0]==="WH"?"Use":"Guest state"}</dt><dd>{room[0]==="WH"?"Available by request":room[2]==="occupied"?"In house":room[2]==="arriving"?"Arriving":room[2]==="departing"?"Departing":"Vacant"}</dd></div><div><dt>Stay</dt><dd>{room[0]==="WH"?"Not scheduled":"Jul 12 → Jul 15"}</dd></div><div><dt>Housekeeping</dt><dd>{room[0]==="WH"?"Whole-house preparation":Number(room[0])<=6?"Eliana Mullins":"Delmara Garule"}</dd></div><div><dt>Next PM</dt><dd>{room[0]==="WH"?"Jul 29":"Aug 04"}</dd></div></dl><section className="design-notes"><p className="eyebrow">DESIGN NOTES</p>{[[room[0]==="WH"?"Materials":"Shower tile",design[0]],["Artwork",design[1]],["Lighting",design[2]]].map(x=><div key={x[0]}><span>{x[0]}</span><p>{x[1]}</p></div>)}</section><button className="primary" onClick={() => { setView("Housekeeping"); setSelectedRoom(null); }}>Open workflow →</button></aside></div>}
      {guest && <GuestProfileDrawer guest={guest} close={()=>setSelectedGuest(null)} notify={notify} />}
      {menuOpen && <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)}><aside className="mobile-drawer" onClick={e => e.stopPropagation()}><div className="mobile-drawer-head"><img src="/hotel-wren-wordmark-transparent.png" alt="Hotel Wren" /><button aria-label="Close navigation" onClick={() => setMenuOpen(false)}>×</button></div><p className="eyebrow">OPERATIONS</p><nav aria-label="Tablet navigation">{nav.map(n => <button key={n.label} className={view === n.label ? "active" : ""} onClick={() => { setView(n.label); setMenuOpen(false); }}><span>{n.glyph}</span>{n.label}<b>→</b></button>)}</nav><div className="mobile-drawer-foot"><div className="avatar">{initials}</div><div><strong>{displayName}</strong><small>{role}</small></div><button onClick={() => { setSignedIn(false); setMenuOpen(false); }}>Sign out</button></div></aside></div>}
      {workOrderOpen && <WorkOrderDrawer creator={displayName} close={() => setWorkOrderOpen(false)} created={(ticket) => { setMaintenanceTickets(items=>[ticket,...items]); setWorkOrderOpen(false); notify(`Work order ${ticket.id} created and assigned`); }} />}
      {stockCountOpen && <StockCountDrawer creator={displayName} close={() => setStockCountOpen(false)} completed={(variances) => { setStockCountOpen(false); notify(`Stock count saved · ${variances} variance${variances===1?"":"s"} flagged`); }} />}
      {alertsOpen && <AlertsDrawerV2 guestRequests={guestRequests} shopOrders={shopOrders} handled={handledAlerts} onHandle={id=>setHandledAlerts(items=>Array.from(new Set([...items,id])))} close={()=>setAlertsOpen(false)} openView={v=>{setView(v);setAlertsOpen(false)}} />}
      {toast && <div className="toast">✓ {toast}</div>}
      <nav className="mobile-nav">{nav.slice(0,5).map(n => <button key={n.label} className={view === n.label ? "active" : ""} onClick={() => setView(n.label)}><span>{n.glyph}</span><small>{n.label}</small></button>)}</nav>
    </main>
  );
}

type WindsongProduct = { id:string; name:string; maker:string; image:string; summary:string; detail:string; notes:string[] };
const windsongProducts: WindsongProduct[] = [
  {id:"two-deserts-soap",name:"Two Deserts Soap",maker:"Wonder Valley",image:"https://welcometowondervalley.com/cdn/shop/products/DESERT_SOAP_1.png?v=1661498881&width=800",summary:"A plant-based desert bar made with Wonder Valley olive oil.",detail:"Triple-milled for a rich lather that cleanses without stripping. Its aromatic profile brings together the high and low desert in a grounding, green scent.",notes:["142g / 5 oz bar","Juniper, sage, eucalyptus and rosemary","Cardamom, galbanum and vetiver","Microbiome friendly and moisturizing"]},
  {id:"canyon-coffee",name:"Canyon Coffee Pouches",maker:"Wren Pantry",image:"/windsong-canyon-coffee.png",summary:"The coffee waiting in your room, packed to take home.",detail:"A guest-ready package of the Canyon Coffee served at Hotel Wren, selected for an easy, familiar morning ritual after the desert.",notes:["Whole-bean coffee","Prepared by the Windsong team","Room pickup or shipping available"]},
  {id:"bellocq-tea",name:"Bellocq Tea Tin",maker:"Wren Pantry",image:"/windsong-bellocq-tea.png",summary:"A quiet cup from the room ritual, ready for home.",detail:"A beautifully packed tea selection drawn from the Bellocq service offered in every guest room.",notes:["Loose-leaf tea","Reusable tin","Prepared by the Windsong team"]},
  {id:"meditation-blanket",name:"Meditation Blanket",maker:"Hotel Wren",image:"/windsong-meditation-blanket.png",summary:"A soft layer inspired by slow mornings at Wren.",detail:"A woven meditation blanket selected for quiet practice, patio mornings and the drive home.",notes:["Woven textile","Guest-ready packaging","Room pickup or shipping available"]},
];

function GuestPortalV2({weather,requests,submitRequest,orderProduct,signOut}:{weather:{temperature:string;condition:string;high:string;low:string};requests:string[];submitRequest:(request:string)=>void;orderProduct:(product:string)=>void;signOut:()=>void}) {
  const [requestType,setRequestType]=useState("Fresh towels"); const [note,setNote]=useState(""); const [sent,setSent]=useState(false); const [joined,setJoined]=useState(()=>storedValue("nest-wren-list-joined",false)); const [product,setProduct]=useState<WindsongProduct|null>(null); const [ordered,setOrdered]=useState("");
  useEffect(()=>{window.localStorage.setItem("nest-wren-list-joined",JSON.stringify(joined))},[joined]);
  const send=()=>{submitRequest(`${requestType}${note.trim()?` · ${note.trim()}`:""}`);setSent(true);setNote("");window.setTimeout(()=>setSent(false),5000)};
  const placeOrder=(fulfillment:string)=>{if(!product)return;orderProduct(product.name);setOrdered(`${product.name} will be ${fulfillment==="room"?"prepared for Room 05":"shipped after the team confirms your address"}.`);window.setTimeout(()=>{setOrdered("");setProduct(null)},4200)};
  return <main className="guest-portal guest-v2">
    <header className="guest-header"><div className="guest-brand-group"><img src="/hotel-wren-seal-transparent.png" alt="Hotel Wren"/><div className="nest-lockup guest-brand"><strong>The Nest</strong><small>BY HOTEL WREN</small></div></div><div><a href="#shop-windsong">Shop Windsong</a><span className="guest-nav-weather">{weather.temperature}° · {weather.condition}</span><span>ROOM 05 · MAYA &amp; THEO</span><button onClick={signOut}>Sign out</button></div></header>
    <section className="guest-welcome"><p className="eyebrow">YOUR STAY · JULY 12–15</p><h1>What would make<br/>today feel easier?</h1><p>Ask for what you need. The nearest available member of the Wren team will take care of the rest.</p></section>
    <section className="guest-request"><div><p className="eyebrow">MAKE A REQUEST</p><h2>We’re close by.</h2><p>Tell us what would help and the on-property team will see it right away.</p></div><form onSubmit={e=>{e.preventDefault();send()}}><div className="request-options">{["Fresh towels","Room refresh","Maintenance","Local help","Something else"].map(x=><button type="button" className={requestType===x?"selected":""} onClick={()=>setRequestType(x)} key={x}>{x}</button>)}</div><label>Anything we should know?<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="A short note helps us get it right…"/></label><button className="primary" type="submit">Send request →</button>{sent&&<div className="request-sent">✓ Request received. The on-property team has been notified.</div>}</form></section>
    <section className="windsong-shop" id="shop-windsong"><div className="windsong-intro"><p className="eyebrow">SHOP WINDSONG · ALWAYS OPEN HERE</p><h2>Take a little desert with you.</h2><p>Reserve a favorite for pickup at your room, or ask us to ship it home. The team will confirm availability and price before fulfillment.</p></div><div className="windsong-grid">{windsongProducts.map(x=><button className="product-card" key={x.id} onClick={()=>setProduct(x)}><span className="product-image"><img src={x.image} alt=""/></span><small>{x.maker}</small><h3>{x.name}</h3><p>{x.summary}</p><b>View product →</b></button>)}</div></section>
    <section className="guest-guide"><div className="guest-section-head"><p className="eyebrow">THE HI-DESERT, WELL SPENT</p><h2>Go somewhere good.</h2></div><DiningDirectory detailed/><div className="guest-guide-lists">{(["TO DO","NATURE"] as const).map(category=><div key={category}><h3>{category}</h3>{localGuide[category].map(x=>{const p=x.split(" · ");return <article key={x}><strong>{p[0]}</strong><small>{p[1]}</small></article>})}</div>)}</div></section>
    <section className="guest-gallery guest-gallery-v2"><figure className="wide"><img src="/wren-pool-wide.jpg" alt="Hotel Wren pool and palms"/></figure><figure><img src="/wren-pool-loungers.jpg" alt="Pool loungers at Hotel Wren"/></figure><figure><img src="/hotel-wren-lobby.png" alt="Hotel Wren lobby"/></figure><figure><img src="/sunset-deluxe-bedroom-1.png" alt="Hotel Wren guest room"/></figure><figure><img src="/wren-house-patio.jpg" alt="Wren House desert patio"/></figure><figure className="wide"><img src="/wren-house-dining.jpg" alt="Wren House dining room"/></figure></section>
    <section className="guest-signup"><img src="/guest-patio.jpg" alt="Hotel Wren shaded garden seating"/><div><p className="eyebrow">KEEP A LITTLE DESERT WITH YOU</p><h2>Join the Wren list.</h2><p>Occasional notes from Twentynine Palms: seasonal offers, gatherings and reasons to return.</p>{joined?<strong>Welcome to the Wren family. ✓</strong>:<form onSubmit={e=>{e.preventDefault();setJoined(true)}}><input type="email" required placeholder="Email address" aria-label="Email address"/><button type="submit">Sign up →</button></form>}</div></section>
    <footer className="guest-footer"><strong>Hotel Wren</strong><span>Twentynine Palms, California</span><small>{requests.length?`${requests.length} request${requests.length===1?"":"s"} sent this stay`:"Here when you need us."}</small></footer>
    {product&&<div className="product-backdrop" onClick={()=>setProduct(null)}><aside className="product-drawer" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setProduct(null)}>×</button><img src={product.image} alt={product.name}/><div className="product-copy"><p className="eyebrow">SHOP WINDSONG · {product.maker.toUpperCase()}</p><h2>{product.name}</h2><p>{product.detail}</p><ul>{product.notes.map(x=><li key={x}>{x}</li>)}</ul><div className="product-price"><span>Price</span><strong>Confirmed before fulfillment</strong></div>{ordered?<div className="product-confirmation">✓ {ordered}<small>The Windsong team has been notified.</small></div>:<div className="product-actions"><button onClick={()=>placeOrder("room")}>Prepare for my room →</button><button onClick={()=>placeOrder("ship")}>Ship it home + shipping →</button></div>}</div></aside></div>}
  </main>
}

function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) { return <div className="page-head"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{children}</div>; }

function Today({name,guestRequestCount,conditions,onRoom,onGuest,onView,notify}:{name:string;guestRequestCount:number;conditions:Record<string,RoomCondition>;onRoom:(r:string)=>void;onGuest:(id:string)=>void;onView:(v:View)=>void;notify:(s:string)=>void}) {
  const [notes,setNotes]=useState<string[]>(()=>storedValue("nest-shift-notes",["Room 05 anniversary setup needs a final patio sweep before 2:00 PM.","Remove the pool robot after its 90-minute cycle and restore the skimmer after the final swim."]));
  const [draft,setDraft]=useState("");
  const briefingKey=`nest-briefing-read-${localDateKey()}`;
  const [briefingRead,setBriefingRead]=useState(()=>storedValue(briefingKey,false));
  useEffect(()=>{window.localStorage.setItem("nest-shift-notes",JSON.stringify(notes))},[notes]);
  useEffect(()=>{window.localStorage.setItem(briefingKey,JSON.stringify(briefingRead))},[briefingKey,briefingRead]);
  const scheduled=employeeRoster.filter(x=>x.status!=="Off today");
  const conditionCount=(status:RoomCondition)=>rooms.filter(r=>conditions[r[0]]===status).length;
  const addNote=()=>{const value=draft.trim();if(!value)return;setNotes([value,...notes]);setDraft("");notify("Shift note added")};
  return <><PageHead eyebrow={formatOperationalDate(localDateKey()).toUpperCase()} title={`Good morning, ${name}.`}><button className="outline" onClick={() => onView("Team")}>Open shift checklists →</button></PageHead>
    <section className="briefing"><div><p className="eyebrow">TODAY’S BRIEFING</p><h2>Keep the afternoon<br />unhurried.</h2></div><p>Room 05’s anniversary guests arrive at 2:30. Their room is on track, though the patio still needs a final sweep. Windsong opens at four; Jane leads the AM shift and Shamu takes the evening handoff.</p><button onClick={() => {setBriefingRead(true);notify("Briefing marked as read")}}>{briefingRead?"Read ✓":"Mark as read"}</button></section><button className="promo-strip" onClick={()=>onView("Promotions")}><span>LIVE OFFER</span><strong>Settle into Summer at Wren</strong><em>20% off · frozen fruit poolside · late checkout</em><b>View staff details →</b></button>
    <section className="daily-overview">
      <article className="stay-mix-card"><div className="today-card-head"><div><p className="eyebrow">ROOM FLOW</p><h2>Today at a glance.</h2></div><span>12 rooms</span></div><div className="stay-mix-body"><div className="stay-pie" role="img" aria-label="Eight stayovers, two check-ins, and two checkouts"><span><strong>12</strong><small>ROOMS</small></span></div><div className="stay-legend"><div><i className="stayover"/><span><strong>8</strong> Stayovers</span><small>Continuing their stay</small></div><div><i className="checkin"/><span><strong>2</strong> Check-ins</span><small>2:30 PM · 5:15 PM</small></div><div><i className="checkout"/><span><strong>2</strong> Checkouts</span><small>Due by 11:00 AM</small></div></div></div></article>
      <article className="on-duty-card"><div className="today-card-head"><div><p className="eyebrow">TEAM TODAY</p><h2>Who is working.</h2></div><button onClick={()=>onView("Team")}>Full schedule →</button></div><div className="on-duty-list">{scheduled.map(x=><button key={x.name} onClick={()=>onView("Team")}><i className={x.tone}>{x.name.split(" ").map(n=>n[0]).join("")}</i><span><strong>{x.name}</strong><small>{x.role} · {x.zone}</small></span><b>{x.shift}<small>{x.status}</small></b></button>)}</div></article>
    </section>
    <section className="metrics"><article><small>OCCUPANCY TONIGHT</small><strong>83%</strong><span className="positive">10 of 12 rooms</span></article><article><small>ARRIVALS READY</small><strong>1 <em>/ 2</em></strong><span>Room 05 needs final sweep</span></article><article><small>OPEN REQUESTS</small><strong>{3+guestRequestCount}</strong><span>{guestRequestCount?`${guestRequestCount} submitted through The Nest`:"Oldest open · 18 minutes"}</span></article><article><small>ROOMS TO INSPECT</small><strong>2</strong><span>Rooms 05 and 08</span></article></section>
    <div className="dashboard-grid"><section className="panel room-status"><div className="panel-head"><div><p className="eyebrow">PROPERTY PULSE</p><h3>Room status</h3></div><button onClick={() => onView("Property")}>View map →</button></div><div className="room-grid">{rooms.map(r => <button key={r[0]} onClick={() => onRoom(r[0])}><span>{r[0]}</span><StatusDot kind={conditions[r[0]]} /><small>{roomConditionLabels[conditions[r[0]]]}</small></button>)}<button className="house-status-card" onClick={() => onRoom("WH")}><span>Wren House</span><StatusDot kind={conditions.WH}/><small>{roomConditionLabels[conditions.WH]} · by request</small></button></div><div className="legend"><span><StatusDot kind="clean" />Clean {conditionCount("clean")}</span><span><StatusDot kind="dirty" />Dirty {conditionCount("dirty")}</span><span><StatusDot kind="inspect" />Needs inspection {conditionCount("inspect")}</span><span><StatusDot kind="blocked" />Out of order {conditionCount("blocked")}</span></div></section>
      <section className="panel arrivals"><div className="panel-head"><div><p className="eyebrow">GUESTS TODAY</p><h3>Arriving & staying</h3></div><button onClick={() => onView("Guests")}>All guests →</button></div><p className="guest-section-label">2 ARRIVING</p><GuestRow time="2:30" room="05" name="Maya & Theo Calder" note="Anniversary · Bellocq tea setup" tag="RETURNING" onClick={()=>onGuest("maya-calder")} /><GuestRow time="5:15" room="11" name="Nora Bennett" note="First stay · Late arrival" tag="" onClick={()=>onGuest("nora-bennett")} /><p className="guest-section-label stay-label">8 CONTINUING THEIR STAY</p><GuestRow time="STAY" suffix="" room="01" name="Amelia Chen" note="Night 2 of 3 · Pool towels requested" tag="IN HOUSE" onClick={()=>onGuest("amelia-chen")} /><GuestRow time="STAY" suffix="" room="10" name="Daniel & Priya Shah" note="Night 3 of 4 · Dinner recommendation" tag="IN HOUSE" onClick={()=>onGuest("shah")} /></section>
      <section className="panel attention"><div className="panel-head"><div><p className="eyebrow">NEEDS ATTENTION</p><h3>{4+guestRequestCount} open threads</h3></div><span className="count">{4+guestRequestCount}</span></div>{guestRequestCount>0&&<Attention icon="○" title={`${guestRequestCount} new guest request${guestRequestCount===1?"":"s"}`} meta="Submitted through The Nest" tone="clay" onClick={()=>onView("Guests")}/>}<Attention icon="◇" title="Room 03 awaiting clean" meta="Checkout · 48 min ago" tone="clay" onClick={()=>onView("Housekeeping")}/><Attention icon="△" title="Pool heater cycling slowly" meta="Maintenance · Medium" tone="olive" onClick={()=>onView("Maintenance")}/><Attention icon="▦" title="Bath salt below par" meta="Inventory · 6 remaining" tone="sand" onClick={()=>onView("Inventory")}/><Attention icon="$" title="Invoice awaiting approval" meta="Mojave Linen · $0" tone="ink" onClick={()=>onView("Financials")}/></section>
      <section className="panel shift-notes"><div className="panel-head"><div><p className="eyebrow">SHIFT NOTES</p><h3>What the team should know</h3></div><span className="count">{notes.length}</span></div><div className="shift-note-list">{notes.map((x,i)=><article key={`${x}-${i}`}><span>{i===0?"AM":"OPEN"}</span><p>{x}</p></article>)}</div><form onSubmit={e=>{e.preventDefault();addNote()}}><label htmlFor="today-note">Add a note</label><textarea id="today-note" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Guest detail, property update, or handoff…"/><button className="primary" type="submit">Add note →</button></form></section></div></>;
}

function GuestRow({ time, suffix="PM", room, name, note, tag, onClick }: { time: string; suffix?:string; room: string; name: string; note: string; tag: string; onClick:()=>void }) { return <button className="guest-row" onClick={onClick}><div className="time">{time}{suffix&&<small>{suffix}</small>}</div><div className="room-badge">{room}</div><div><strong>{name}</strong><small>{note}</small></div>{tag && <em>{tag}</em>}<b aria-hidden="true">→</b></button>; }
function Attention({icon,title,meta,tone,onClick}:{icon:string;title:string;meta:string;tone:string;onClick:()=>void}) { return <button className="attention-row" onClick={onClick}><span className={tone}>{icon}</span><div><strong>{title}</strong><small>{meta}</small></div><b>→</b></button>; }

function Team({notify}:{notify:(message:string)=>void}) {
  const morning=[
    "Disarm the security system in Windsong and the Lobby",
    "Clock in immediately upon arrival",
    "Unlock all doors in Windsong and the Lobby",
    "Set lighting: Lobby 25% · Windsong 50%",
    "Turn off call forwarding on the Hotel Wren phone",
    "Set 7–9 AM music: Lobby 30 · Windsong 35 · Pool 0",
    "Set 9 AM–close music: Lobby 30 · Windsong 35 · Pool 50",
    "Review Slack passdown and pending tasks",
    "Fluff Lobby cushions and straighten tables",
    "Prepare the breakfast setup",
    "During breakfast, engage guests, keep the area tidy, and take dirty dishes to the laundry room",
    "Check hello@hotelwren29.com, texts, and voicemails",
    "Audit arriving-room assignments and review pet, feather-free, and other preferences",
    "Review Mews arrivals, special requests, and guest notables",
    "Review Marriott Bonvoy arrivals and note status preferences or requests",
    "Send the Housekeeping board to Slack #housekeeping",
    "Unlock and straighten chairs outside Windsong; bring out the rattan chairs",
    "Remove the pool skimmer",
    "Place Scumba in the pool for 90 minutes",
    "After breakfast, clear food and beverage areas; wipe tables, sweep floors, and clean doors and surfaces",
    "Remove Scumba from the pool",
    "Re-audit room assignments and make any needed adjustments",
    "Print registration cards and write total authorization at top right: rate + $75 per night",
    "Confirm every Welcome Note is accurate",
    "Inspect arriving rooms and adjust room climate",
    "Place arrival amenities: handwritten note, caramels, and creosote branch",
    "Windsong: restock, straighten, dust, wipe counters and doors, and clean sink and fridges",
    "Lobby: dust, wipe glass, clean tables and floors, and burn incense",
    "Lobby restroom: restock hand towels and toilet paper; remove used towels",
    "Confirm minibar charges are posted to all departing rooms",
    "Check out departing guests in Mews and email their folios",
    "Send welcome texts to tomorrow’s arrivals",
    "Update guest profiles with preferences, allergies, car information, pet fees, and other notables",
    "Post pet fees for today’s arrivals when applicable",
    "Draft Shift Notes using the Notes app template",
    "File registration cards: today’s cards in green folder; signed cards in white folder",
    "Wipe down the laptop and credit-card device",
    "Clear and organize desk drawers and surfaces",
    "Clean and store the coffee and tea setup; tidy Lobby shelves",
  ];
  const afternoon=[
    "Clock in and receive the AM handoff: arrivals, pending tasks, and in-house guest details",
    "Review Mews guest requests and reservation notes",
    "Review Slack and respond to new messages",
    "Review Gmail and respond to new emails",
    "Check Housekeeping room statuses and update Mews",
    "Confirm every arrival room is ready with amenities placed",
    "Check in guests as they arrive",
    "Verify guest ID and credit card",
    "Acknowledge Marriott Bonvoy status when applicable",
    "Confirm applicable Bonvoy benefits: upgrade, late checkout, or bonus points",
    "Authorize card for room, tax, and $75 per night incidentals",
    "Provide a property tour, hand off keys, and serve a welcome beverage",
    "Update guest profiles with preferences, allergies, car information, pet fees, and other notables",
    "Follow up with Housekeeping on remaining dishes, laundry, or room items",
    "Text tomorrow’s bagel order to 29Loaves",
    "Clean and organize Windsong and the Lobby; restock, dust, wipe surfaces, and remove back-of-house items",
    "Restock the Lobby restroom: hand towels and toilet paper; remove used towels",
    "Send 9-Day-Out emails, counting today as Day 1",
    "At dusk, set Lobby lighting to 50–60%; use the fireplace on cooler nights and place the sofa blanket",
    "Walk the exterior and straighten the Courtyard",
    "Send checkout texts to tomorrow’s departing guests",
    "Review tomorrow’s Bonvoy arrivals and place the applicable Status Benefit template in Notes",
    "Research guests arriving in three days and add respectful personalization notes in Mews",
    "Review Bonvoy arrivals in three days and upgrade when available",
    "Close the pool at dusk: tie umbrellas and take towels and hamper to the laundry room",
    "Store the sunscreen tray and cups in Windsong",
    "Wipe the pool water dispenser",
    "Place the pool skimmer in the pool when no guests are present",
    "At dusk, lock chairs outside Windsong and bring wicker chairs inside",
    "Turn off Connex lights and lock the door",
    "At 6 PM, set Mews restrictions to close the house for the night",
    "Verify every departure is checked out",
    "Post pet fees for today’s arrivals when applicable",
    "Write next-day Welcome Notes and store them in the drawer",
    "Tidy pantry shelves, dust, and restock",
    "Restock any missing items in Windsong",
    "Call pending arrivals at 8 PM for an ETA",
    "Call the GM for pending or late check-ins",
    "Clean the Lobby water dispenser and store it in Windsong",
    "Store Lobby fruit in the Windsong fridge; wipe the bowl and leave it to dry",
    "Empty small bins in the Lobby, restroom, pool, and Windsong; replace liners",
    "Finalize Shift Notes and send them to the Shift Notes Slack channel",
    "Set call forwarding to Answer Connect on the Hotel Wren phone",
    "Plug in the Wren phone and store the laptop in the cabinet",
    "Lobby close: turn off Sonos, HVAC, and fireplace; dim lights to 40%",
    "Final Lobby check: fluff pillows, align furniture, straighten books, empty incense bowl, and clear desk",
    "Lock the Lobby front door, arm the security system Away, then exit and lock the Courtyard-facing door",
    "Final Courtyard check: secure Room 3, Laundry, pool rooms, vacant rooms, and gates; confirm firepit off and pool clear",
    "Windsong close: turn off HVAC and dim lights to 40%",
    "Final Windsong check: straighten retail, empty and clean sink, clean counters, and confirm lights at 40%",
    "Lock the Windsong front door and arm the security system Away",
    "Clock out on Toast POS, exit through the Courtyard-facing door, and lock it behind you",
  ];
  type ShiftMeta={completedBy:string;handoffNote:string;signedAt:string;itemTimes:(string|null)[]};
  type ShiftRecord={morning:boolean[];afternoon:boolean[];morningMeta?:ShiftMeta;afternoonMeta?:ShiftMeta;updatedAt:string};
  type ShiftHistory=Record<string,ShiftRecord>;
  const todayKey=localDateKey();
  const [selectedDate,setSelectedDate]=useState(todayKey);
  const [checklistHistory,setChecklistHistory]=useState<ShiftHistory>(()=>{
    const saved=storedValue<ShiftHistory>("nest-shift-checklist-history",{});
    if(Object.keys(saved).length)return saved;
    const legacy=storedValue<{morning?:boolean[];afternoon?:boolean[]}>("nest-shift-checklists",{});
    return {[todayKey]:{
      morning:legacy.morning?.length===morning.length?legacy.morning:morning.map((_,i)=>i<2),
      afternoon:legacy.afternoon?.length===afternoon.length?legacy.afternoon:afternoon.map(()=>false),
      updatedAt:new Date().toISOString(),
    }};
  });
  useEffect(()=>{window.localStorage.setItem("nest-shift-checklist-history",JSON.stringify(checklistHistory))},[checklistHistory]);
  const selectedRecord=checklistHistory[selectedDate];
  const morningDone=selectedRecord?.morning?.length===morning.length?selectedRecord.morning:morning.map(()=>false);
  const afternoonDone=selectedRecord?.afternoon?.length===afternoon.length?selectedRecord.afternoon:afternoon.map(()=>false);
  const blankMeta=(length:number):ShiftMeta=>({completedBy:"",handoffNote:"",signedAt:"",itemTimes:Array(length).fill(null)});
  const morningMeta=selectedRecord?.morningMeta||blankMeta(morning.length);
  const afternoonMeta=selectedRecord?.afternoonMeta||blankMeta(afternoon.length);
  const updateChecklist=(shift:"morning"|"afternoon",next:boolean[],index:number)=>setChecklistHistory(history=>{
    const current=history[selectedDate];
    const metaKey=shift==="morning"?"morningMeta":"afternoonMeta";
    const existing=current?.[metaKey]||blankMeta(shift==="morning"?morning.length:afternoon.length);
    const itemTimes=[...existing.itemTimes];itemTimes[index]=next[index]?new Date().toISOString():null;
    return {...history,[selectedDate]:{
      morning:shift==="morning"?next:(current?.morning?.length===morning.length?current.morning:morning.map(()=>false)),
      afternoon:shift==="afternoon"?next:(current?.afternoon?.length===afternoon.length?current.afternoon:afternoon.map(()=>false)),
      morningMeta:shift==="morning"?{...existing,itemTimes,signedAt:""}:(current?.morningMeta||blankMeta(morning.length)),
      afternoonMeta:shift==="afternoon"?{...existing,itemTimes,signedAt:""}:(current?.afternoonMeta||blankMeta(afternoon.length)),
      updatedAt:new Date().toISOString(),
    }};
  });
  const updateShiftMeta=(shift:"morning"|"afternoon",patch:Partial<ShiftMeta>)=>setChecklistHistory(history=>{
    const current=history[selectedDate];
    const existing=shift==="morning"?(current?.morningMeta||blankMeta(morning.length)):(current?.afternoonMeta||blankMeta(afternoon.length));
    return {...history,[selectedDate]:{
      morning:current?.morning?.length===morning.length?current.morning:morning.map(()=>false),
      afternoon:current?.afternoon?.length===afternoon.length?current.afternoon:afternoon.map(()=>false),
      morningMeta:shift==="morning"?{...existing,...patch}:(current?.morningMeta||blankMeta(morning.length)),
      afternoonMeta:shift==="afternoon"?{...existing,...patch}:(current?.afternoonMeta||blankMeta(afternoon.length)),
      updatedAt:new Date().toISOString(),
    }};
  });
  const savedDates=Object.keys(checklistHistory).sort((a,b)=>b.localeCompare(a));
  const dateLabel=formatOperationalDate(selectedDate);
  const staff=employeeRoster;
  const exportSchedule=()=>{const rows=[["Employee","Role","Shift","Zone","Status"],...staff.map(x=>[x.name,x.role,x.shift,x.zone,x.status])];downloadText(`hotel-wren-schedule-${selectedDate}.csv`,rows.map(row=>row.map(value=>`"${value.replaceAll('"','""')}"`).join(",")).join("\n"));notify("Schedule exported as CSV")};
  const checklist=(title:string,time:string,shift:"morning"|"afternoon",items:string[],done:boolean[],meta:ShiftMeta)=><section className="shift-checklist"><header><div><p className="eyebrow">{time}</p><h2>{title}</h2><small>{dateLabel}</small></div><strong>{done.filter(Boolean).length}/{items.length}</strong></header><div className="shift-progress"><i style={{width:`${done.filter(Boolean).length/items.length*100}%`}}/></div>{items.map((item,i)=><label className={done[i]?"done":""} key={item}><input type="checkbox" checked={done[i]} onChange={()=>{const next=[...done];next[i]=!next[i];updateChecklist(shift,next,i)}}/><span>✓</span><p>{item}{meta.itemTimes[i]&&<small className="item-time">Completed {formatOperationalTime(meta.itemTimes[i]!)}</small>}</p></label>)}<div className="shift-record-meta"><label>Completed by<select value={meta.completedBy} onChange={e=>updateShiftMeta(shift,{completedBy:e.target.value,signedAt:""})}><option value="">Choose employee</option>{employeeRoster.filter(x=>x.status!=="Off today").map(x=><option key={x.name}>{x.name}</option>)}</select></label><label>Handoff note<textarea value={meta.handoffNote} onChange={e=>updateShiftMeta(shift,{handoffNote:e.target.value,signedAt:""})} placeholder="What should the next shift know?"/></label><div className="shift-signoff"><button disabled={!meta.completedBy} onClick={()=>updateShiftMeta(shift,{signedAt:new Date().toISOString()})}>{meta.signedAt?"Signed off ✓":"Sign off shift →"}</button>{meta.signedAt&&<small>{meta.completedBy} · {formatOperationalTime(meta.signedAt)}</small>}</div></div></section>;
  return <><PageHead eyebrow="TEAM · SCHEDULE & HANDOFFS" title="A steady day starts together."><button className="outline" onClick={exportSchedule}>Export schedule ↓</button></PageHead>
    <section className="schedule-board"><div className="schedule-heading"><div><p className="eyebrow">TODAY’S SCHEDULE</p><h2>Who is here.</h2></div><span><i/> 6 scheduled · 5 on property</span></div><div className="staff-roster">{staff.map(x=><button key={x.name} className={x.status==="Off today"?"off-duty":""} onClick={()=>notify(`${x.name} · ${x.shift} · ${x.zone}`)}><i className={x.tone}>{x.name.split(" ").map(n=>n[0]).join("")}</i><span><strong>{x.name}</strong><small>{x.role}</small></span><span><strong>{x.shift}</strong><small>{x.zone}</small></span><b>{x.status}</b></button>)}</div></section>
    <section className="checklist-history-bar"><div><p className="eyebrow">DAILY SHIFT RECORD</p><h2>{dateLabel}</h2><span>{selectedRecord?`Saved · ${morningDone.filter(Boolean).length+afternoonDone.filter(Boolean).length} of ${morning.length+afternoon.length} complete`:"No saved activity for this date"}</span></div><div className="checklist-date-controls"><button aria-label="Previous checklist date" onClick={()=>setSelectedDate(moveDateKey(selectedDate,-1))}>←</button><label>Date<input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></label><button aria-label="Next checklist date" onClick={()=>setSelectedDate(moveDateKey(selectedDate,1))}>→</button><button className="today-button" disabled={selectedDate===todayKey} onClick={()=>setSelectedDate(todayKey)}>Today</button><label>Saved dates<select value={selectedRecord?selectedDate:""} onChange={e=>e.target.value&&setSelectedDate(e.target.value)}><option value="">Choose a past date</option>{savedDates.map(date=><option key={date} value={date}>{formatOperationalDate(date)}</option>)}</select></label></div></section>
    <div className="shift-grid">{checklist("Morning shift","OPEN · 7:00 AM","morning",morning,morningDone,morningMeta)}{checklist("Afternoon shift","HANDOFF · 3:00 PM","afternoon",afternoon,afternoonDone,afternoonMeta)}</div>
  </>;
}

function GuestProfileDrawer({guest,close,notify}:{guest:GuestProfile;close:()=>void;notify:(message:string)=>void}) {
  return <div className="drawer-backdrop guest-profile-backdrop" onClick={close}><aside className="guest-profile-drawer" onClick={e=>e.stopPropagation()}>
    <header className="profile-command"><button className="close" onClick={close}>×</button><span className="source-chip">MEWS · DATA MAPPING</span><div><button onClick={()=>notify(`Message drafted for ${guest.name}`)}>Message</button><button onClick={()=>notify(`Note added to ${guest.name}`)}>＋ Note</button><button className="primary" onClick={()=>notify(`Task created for Room ${guest.room}`)}>＋ Task</button></div></header>
    <section className="profile-identity"><div className="profile-avatar">{guest.initials}</div><div><p className="eyebrow">GUEST PROFILE · {guest.confirmation}</p><h2>{guest.name}</h2><div className="profile-tags">{guest.tags.map(x=><span key={x}>{x}</span>)}</div></div><div className={`profile-status ${guest.status.toLowerCase().replace(" ","-")}`}><small>STAY STATUS</small><strong>{guest.status}</strong></div></section>
    <section className="stay-ribbon"><div><small>ARRIVAL</small><strong>{guest.arrival}</strong><span>{guest.eta}</span></div><b>→</b><div><small>DEPARTURE</small><strong>{guest.departure}</strong><span>{guest.nights} nights</span></div><div className="stay-room"><small>ROOM</small><strong>{guest.room}</strong><span>{guest.roomType}</span></div></section>
    <div className="profile-grid">
      <section className="profile-card"><p className="eyebrow">RESERVATION</p><dl><div><dt>Confirmation</dt><dd>{guest.confirmation}</dd></div><div><dt>Party</dt><dd>{guest.party}</dd></div><div><dt>Booked via</dt><dd>{guest.source}</dd></div><div><dt>Rate plan</dt><dd>{guest.ratePlan}</dd></div><div><dt>Nightly rate</dt><dd>{guest.nightly}</dd></div><div><dt>Stay total</dt><dd>{guest.total}</dd></div><div><dt>Balance</dt><dd>{guest.balance}</dd></div></dl></section>
      <section className="profile-card"><p className="eyebrow">CONTACT &amp; HISTORY</p><a href={`mailto:${guest.email}`}>{guest.email}</a><a href={`tel:${guest.phone.replace(/\D/g,"")}`}>{guest.phone}</a><div className="history-callout"><small>STAY HISTORY</small><strong>{guest.history}</strong></div><p className="privacy-copy">Contact details shown here are fictional preview data. Live access should follow Mews permissions and Hotel Wren privacy policy.</p></section>
      <section className="profile-card wide"><p className="eyebrow">PREFERENCES &amp; SERVICE NOTES</p><div className="profile-notes"><div><h3>Remember</h3>{guest.preferences.map(x=><span key={x}>○ {x}</span>)}</div><div><h3>This stay</h3>{guest.notes.map(x=><p key={x}>{x}</p>)}</div></div></section>
      <section className="profile-card wide"><p className="eyebrow">STAY TIMELINE</p><div className="profile-timeline">{guest.timeline.map(([time,event])=><div key={time+event}><span>{time}</span><i/><strong>{event}</strong></div>)}</div></section>
    </div>
    <footer className="profile-foot"><span><b>MEWS</b> guest + reservation + resource + balance</span><span><b>DIAMO</b> rate context</span><span><b>THE NEST</b> service notes + tasks</span></footer>
  </aside></div>;
}

function Property({ onRoom,conditions }: { onRoom: (r: string) => void; conditions:Record<string,RoomCondition> }) { const count=(status:RoomCondition)=>rooms.filter(r=>conditions[r[0]]===status).length; return <><PageHead eyebrow="THE PROPERTY" title="Twelve rooms, one living place."><div className="segmented"><button className="selected">Map</button><button>Calendar</button></div></PageHead><div className="map-layout"><section className="site-map"><button className={`map-label lobby house-map-button condition-${conditions.WH}`} onClick={()=>onRoom("WH")}>WREN HOUSE<br/><small>{roomConditionLabels[conditions.WH].toUpperCase()} · VIEW DETAILS</small></button><div className="property-wall"><span>PATHWAY / WALL</span></div><div className="map-label windsong">LOBBY<br/><small>ARRIVAL · RECEPTION</small></div><div className="map-label windsong-shop">WINDSONG<br/><small>BODEGA · GOODS</small></div><div className="pool"><span>POOL</span></div><div className="garden">DESERT GARDEN</div>{rooms.map((r,i) => <button key={r[0]} className={`map-room room-${i+1} ${r[2]} condition-${conditions[r[0]]}`} onClick={() => onRoom(r[0])}><span>{r[0]}</span><StatusDot kind={conditions[r[0]]} /></button>)}<div className="firepit">FIRE<br />PIT</div></section><aside className="map-summary"><p className="eyebrow">HOUSEKEEPING STATUS</p><h3>Tap any room to update it.</h3>{(["clean","dirty","inspect","blocked"] as RoomCondition[]).map(status => <div className="summary-row" key={status}><StatusDot kind={status} /><span>{roomConditionLabels[status]}</span><strong>{count(status)}</strong></div>)}</aside></div></> }

function Housekeeping({checklist,setChecklist,notify,activeTask,setActiveTask,openWorkOrder,updateRoom}:{checklist:boolean[];setChecklist:(x:boolean[])=>void;notify:(s:string)=>void;activeTask:number;setActiveTask:(i:number)=>void;openWorkOrder:()=>void;updateRoom:(room:string,status:RoomCondition)=>void}) { const task=tasks[activeTask]; const labels=activeTask===1?["Confirm room is vacant","Inspect bed and linen presentation","Check bathroom fixtures and amenities","Confirm patio glassware placement","Test lighting and arrival temperature","Approve room for arrival"]:activeTask===2?["Confirm welcome setup","Sweep private patio","Place anniversary card","Check Bellocq tea selection","Set lamps for arrival","Confirm room ready with host"]:["Confirm guest has departed","Check and log left items","Strip and inspect bedding","Make bed to Wren standard","Clean bathroom and reset Bellocq tea","Set arrival temperature and lighting"]; const submit=()=>{const status:RoomCondition=activeTask===1?"clean":"inspect";updateRoom(task.room,status);notify(`Room ${task.room} ${activeTask===1?"approved and marked clean":"submitted and marked for inspection"}`)}; return <><PageHead eyebrow="HOUSEKEEPING · MOBILE WORKFLOW" title="Care, room by room."/><div className="hk-layout"><section className="task-list"><p className="eyebrow">TODAY · 3 ASSIGNMENTS</p>{tasks.map((t,i)=><button key={t.room} className={i===activeTask?"selected-task":""} onClick={()=>setActiveTask(i)}><span className="big-room">{t.room}</span><div><strong>{t.type}</strong><small>{t.note}</small><em>{t.priority} · {t.time}</em></div><b>→</b></button>)}</section><section className="checklist"><div className="check-top"><div><p className="eyebrow">ROOM {task.room} · {task.type.toUpperCase()}</p><h2>{activeTask===1?"Final inspection":activeTask===2?"Arrival details":"Entry & bedroom"}</h2></div><div className="timer">LIVE <span>{checklist.filter(Boolean)}/{labels.length}</span></div></div><div className="progress"><i style={{width:`${checklist.filter(Boolean).length/labels.length*100}%`}} /><span>{checklist.filter(Boolean).length} of {labels.length}</span></div>{labels.map((x,i)=><label className={checklist[i]?"done":""} key={x}><input type="checkbox" checked={checklist[i]} onChange={()=>{const n=[...checklist];n[i]=!n[i];setChecklist(n)}}/><span>✓</span>{x}</label>)}<div className="check-actions"><button onClick={openWorkOrder}>△ Report issue</button><button className="primary" disabled={checklist.some(value=>!value)} onClick={submit}>{activeTask===1?"Approve room":"Submit for inspection"} →</button></div></section></div><HousekeepingSheet notify={notify}/></> }

function HousekeepingSheet({notify}:{notify:(s:string)=>void}) {
  const roomNumbers=["01","02","03","04","05","06","07","08","09","10","11","12"];
  type BoardSheet=Record<string,{checkout:boolean;stay:boolean;sheets:boolean}>;
  type BoardRecord={sheet:BoardSheet;employeeName:string;minibar:string;sheetNotes:string;managerName?:string;signedAt?:string;savedAt:string};
  type BoardHistory=Record<string,BoardRecord>;
  const emptySheet=()=>Object.fromEntries(roomNumbers.map(room=>[room,{checkout:["02","03"].includes(room),stay:["01","07","10"].includes(room),sheets:false}])) as BoardSheet;
  const todayKey=localDateKey();
  const [boardHistory,setBoardHistory]=useState<BoardHistory>(()=>{
    const saved=storedValue<BoardHistory>("nest-housekeeping-board-history",{});
    if(Object.keys(saved).length)return saved;
    const legacy=storedValue<{sheet?:BoardSheet;employeeName?:string;sheetDate?:string;minibar?:string;sheetNotes?:string}>("nest-housekeeping-board",{});
    if(!legacy.sheet)return {};
    return {[legacy.sheetDate||todayKey]:{sheet:legacy.sheet,employeeName:legacy.employeeName||"",minibar:legacy.minibar||"",sheetNotes:legacy.sheetNotes||"",savedAt:new Date().toISOString()}};
  });
  const initialBoard=boardHistory[todayKey];
  const [sheet,setSheet]=useState<BoardSheet>(initialBoard?.sheet||emptySheet());
  const [employeeName,setEmployeeName]=useState(initialBoard?.employeeName||"");
  const [sheetDate,setSheetDate]=useState(todayKey);
  const [minibar,setMinibar]=useState(initialBoard?.minibar||"");
  const [sheetNotes,setSheetNotes]=useState(initialBoard?.sheetNotes||"");
  const [managerName,setManagerName]=useState(initialBoard?.managerName||"");
  const [signedAt,setSignedAt]=useState(initialBoard?.signedAt||"");
  const [dirty,setDirty]=useState(false);
  const recordForCurrentDate=():BoardRecord=>({sheet,employeeName,minibar,sheetNotes,managerName,signedAt,savedAt:new Date().toISOString()});
  const saveBoard=(quiet=false)=>{const next={...boardHistory,[sheetDate]:recordForCurrentDate()};setBoardHistory(next);window.localStorage.setItem("nest-housekeeping-board-history",JSON.stringify(next));setDirty(false);if(!quiet)notify(`Housekeeping board saved for ${formatOperationalDate(sheetDate)}`);return next};
  const openBoard=(date:string)=>{const history=dirty?saveBoard(true):boardHistory;const saved=history[date];setSheetDate(date);setSheet(saved?.sheet||emptySheet());setEmployeeName(saved?.employeeName||"");setMinibar(saved?.minibar||"");setSheetNotes(saved?.sheetNotes||"");setManagerName(saved?.managerName||"");setSignedAt(saved?.signedAt||"");setDirty(false)};
  const changed=()=>{setDirty(true);setSignedAt("")};
  const toggle=(room:string,key:"checkout"|"stay"|"sheets")=>{setSheet({...sheet,[room]:{...sheet[room],[key]:!sheet[room][key]}});changed()};
  const signBoard=()=>{if(!managerName)return;const time=new Date().toISOString();const record={sheet,employeeName,minibar,sheetNotes,managerName,signedAt:time,savedAt:time};const next={...boardHistory,[sheetDate]:record};setSignedAt(time);setBoardHistory(next);window.localStorage.setItem("nest-housekeeping-board-history",JSON.stringify(next));setDirty(false);notify(`Housekeeping board signed by ${managerName}`)};
  const exportBoard=()=>{const rows=[["Hotel Wren housekeeping board",formatOperationalDate(sheetDate)],["Employee",employeeName],["Manager / inspector",managerName],["Approved",signedAt||"Not approved"],[],["Room","Checkout","Stayover","Replace sheets"],...roomNumbers.map(room=>[room,sheet[room].checkout?"Yes":"",sheet[room].stay?"Yes":"",sheet[room].sheets?"Yes":""]),[],["Minibar consumption",minibar],["Notes",sheetNotes]];downloadText(`hotel-wren-housekeeping-${sheetDate}.csv`,rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(",")).join("\n"));notify("Housekeeping board exported as CSV")};
  const savedDates=Object.keys(boardHistory).sort((a,b)=>b.localeCompare(a));
  const stayover=["Remove and discard trash","Replace soiled towels with fresh towels","Replenish bathroom amenities; wipe sink and toilet as needed","Make the bed to turn-down standard","Clean significant issues such as spills, stains, crumbs, or illness","Look under beds for items left behind","Confirm linen and duvet are stain-free","Keep door ajar during refresh and lock it afterward","Confirm hot water and a functioning AC remote","Set room to 75°F in summer and 68°F in winter"];
  const reminders=["Respect every Do Not Disturb sign","Text the Front Desk whenever a room is complete","Review the checklist before requesting inspection","Report broken or missing items to the Front Desk with a photo"];
  const table=(numbers:string[])=><div className="hk-sheet-table"><header><span>Room</span><span>C/OUT</span><span>Stay</span><span>Replace<br/>sheets</span></header>{numbers.map(room=><div key={room}><strong>{room}</strong>{(["checkout","stay","sheets"] as const).map(key=><label key={key}><input aria-label={`Room ${room} ${key}`} type="checkbox" checked={sheet[room][key]} onChange={()=>toggle(room,key)}/><span>✓</span></label>)}</div>)}</div>;
  return <section className="housekeeping-sheet"><header><div><p className="eyebrow">DAILY DIGITAL BOARD</p><h2>Housekeeping sheet</h2><small>{formatOperationalDate(sheetDate)} · {boardHistory[sheetDate]?"Saved record":"New record"}{dirty?" · Unsaved changes":""}{signedAt?` · Approved ${formatOperationalTime(signedAt)}`:""}</small></div><div className="hk-header-actions"><button className="outline" onClick={exportBoard}>Export CSV ↓</button><button className="outline" onClick={()=>saveBoard()}>Save board ✓</button></div></header><div className="hk-sheet-meta"><label>Name<input aria-label="Housekeeping employee name" value={employeeName} onChange={e=>{setEmployeeName(e.target.value);changed()}}/></label><label>Date<div className="hk-board-date"><button aria-label="Previous housekeeping date" onClick={()=>openBoard(moveDateKey(sheetDate,-1))}>←</button><input aria-label="Housekeeping sheet date" type="date" value={sheetDate} onChange={e=>openBoard(e.target.value)}/><button aria-label="Next housekeeping date" onClick={()=>openBoard(moveDateKey(sheetDate,1))}>→</button><button disabled={sheetDate===todayKey} onClick={()=>openBoard(todayKey)}>Today</button></div></label><label>Past saved boards<select value={boardHistory[sheetDate]?sheetDate:""} onChange={e=>e.target.value&&openBoard(e.target.value)}><option value="">Choose a saved date</option>{savedDates.map(date=><option value={date} key={date}>{formatOperationalDate(date)}</option>)}</select></label></div><div className="hk-sheet-tables">{table(roomNumbers.slice(0,6))}{table(roomNumbers.slice(6))}</div><div className="hk-sheet-guides"><article><h3>Stayover service includes</h3>{stayover.map(x=><p key={x}>□ {x}</p>)}</article><article><h3>Important daily reminders</h3>{reminders.map(x=><p key={x}>□ {x}</p>)}</article></div><div className="hk-sheet-writing"><label>Minibar consumption<textarea value={minibar} onChange={e=>{setMinibar(e.target.value);changed()}} placeholder="Room · item · quantity…"/></label><label>Notes<textarea value={sheetNotes} onChange={e=>{setSheetNotes(e.target.value);changed()}} placeholder="Room condition, maintenance, lost items, or follow-up…"/></label></div><div className="hk-board-approval"><label>Manager / inspector<select value={managerName} onChange={e=>{setManagerName(e.target.value);changed()}}><option value="">Choose approver</option><option>Eric</option><option>Jessica</option><option>Jane Rozhda</option></select></label><button disabled={!managerName} onClick={signBoard}>{signedAt?`Approved by ${managerName} ✓`:"Approve daily board →"}</button>{signedAt&&<small>{formatOperationalDate(sheetDate)} · {formatOperationalTime(signedAt)}</small>}</div><footer><span>Text the Front Desk when each room is complete.</span><button className="primary" onClick={()=>saveBoard()}>Save housekeeping sheet →</button></footer></section>;
}

function DiningDirectory({detailed=false}:{detailed?:boolean}) { return <div className={`dining-grid ${detailed?"detailed":""}`}>{diningGuide.map(x=><article key={x.name}><small>{x.place}</small><h3>{x.name}</h3>{detailed&&<p>{x.detail}</p>}<a className="guide-phone" href={`tel:${x.tel}`}>{x.phone}</a><a className="guide-link" href={x.url} target={x.url.startsWith("http")?"_blank":undefined} rel="noreferrer">{x.action} ↗</a></article>)}</div> }

function Guests({notify,guestRequests,createRequest,onGuest}:{notify:(s:string)=>void;guestRequests:string[];createRequest:(request:string)=>void;onGuest:(id:string)=>void}) {
  const [guideTab,setGuideTab]=useState("EAT & DRINK");
  const [stayFilter,setStayFilter]=useState("All stays");
  const requestRows=[...guestRequests.map((x,i)=>["05",x,"Guest submitted","Now",`guest-${i}`]),["07","Extra meditation blanket","In progress","12 min","07"],["10","Quiet dinner recommendation","Acknowledged","4 min","10"],["01","Later pool towels","Waiting","28 min","01"]];
  const visibleGuests=stayFilter==="All stays"?guestProfiles:guestProfiles.filter(g=>g.status===stayFilter);
  return <>
    <PageHead eyebrow="GUESTS · MEWS-READY WORKSPACE" title="Know the stay. Remember the person."><button className="primary" onClick={()=>{const request=window.prompt("What does the guest need?");if(request?.trim()){createRequest(request.trim());notify("Guest request added and team alerted")}}}>＋ New request</button></PageHead>
    <section className="guest-roster">
      <div className="roster-toolbar"><div><p className="eyebrow">CURRENT &amp; EXPECTED</p><h2>Guest ledger</h2></div><div className="segmented">{["All stays","Arriving","In house","Departing"].map(x=><button key={x} className={stayFilter===x?"selected":""} onClick={()=>setStayFilter(x)}>{x}</button>)}</div></div>
      <div className="roster-head"><span>GUEST</span><span>STAY</span><span>ROOM</span><span>BOOKING</span><span>STATUS</span><span /></div>
      {visibleGuests.map(g=><button className="roster-row" key={g.id} onClick={()=>onGuest(g.id)}><span className="roster-person"><i>{g.initials}</i><span><strong>{g.name}</strong><small>{g.tags.join(" · ")}</small></span></span><span><strong>{g.arrival.replace(", 2026","")} → {g.departure.replace(", 2026","")}</strong><small>{g.nights} nights · {g.party}</small></span><span><b>{g.room}</b><small>{g.roomType}</small></span><span><strong>{g.confirmation}</strong><small>{g.source}</small></span><span className={`stay-state ${g.status.toLowerCase().replace(" ","-")}`}>{g.status}</span><span className="row-arrow">→</span></button>)}
      <p className="source-note"><span>MEWS</span> Guest, reservation, room assignment, balance and stay-state fields are mapped for Connector API data.</p>
    </section>
    <div className="guest-board"><section className="arrival-card featured"><p className="eyebrow">NEXT ARRIVAL · 2:30 PM · ROOM 05</p><h2>Maya &amp; Theo</h2><span className="tag">RETURNING · ANNIVERSARY</span><div className="readiness"><div><small>ROOM READINESS</small><strong>On track</strong></div><b>86%</b></div><ul><li className="complete">Pre-arrival note sent</li><li className="complete">Bellocq tea selected</li><li>Patio sweep &amp; lantern check</li><li>Welcome card from Eric</li></ul><button onClick={()=>onGuest("maya-calder")}>Open guest profile →</button></section><section className="requests"><div className="panel-head"><div><p className="eyebrow">REQUEST BOARD</p><h3>Open guest requests</h3></div><span className="count">{requestRows.length}</span></div>{requestRows.map(r=><div className={`request ${r[2]==="Guest submitted"?"guest-submitted":""}`} key={r[4]}><span>{r[0]}</span><div><strong>{r[1]}</strong><small>{r[2]} · {r[3]}</small></div><button onClick={()=>notify(`${r[1]} opened`)}>→</button></div>)}</section></div>
    <section className="local-guide"><div className="guide-head"><div><p className="eyebrow">LOCAL GUIDE</p><h2>Send them somewhere good.</h2></div><div className="guide-tabs">{Object.keys(localGuide).map(x=><button className={guideTab===x?"active":""} onClick={()=>setGuideTab(x)} key={x}>{x}</button>)}</div></div>{guideTab==="EAT & DRINK"?<DiningDirectory/>:<div className="guide-grid">{localGuide[guideTab as keyof typeof localGuide].map(x=>{const p=x.split(" · ");return <button key={x} onClick={()=>notify(`${p[0]} recommendation copied`)}><strong>{p[0]}</strong><small>{p[1]}</small><b>Copy →</b></button>})}</div>}</section>
  </>;
}

function Resources({onView}:{onView:(view:View)=>void}) {
  const resources=[
    {number:"01",title:"Service principles",copy:"The hi-desert approach to warm, observant and unhurried care.",meta:"Field guide",action:()=>onView("Knowledge")},
    {number:"02",title:"Room standards",copy:"Room types, design details, presentation and inspection touchpoints.",meta:"Field guide",action:()=>onView("Knowledge")},
    {number:"03",title:"Emergency & safety",copy:"Quick access to safety, incident and emergency policies in the handbook.",meta:"Handbook · pages 31–35",action:()=>window.open("/resources/hotel-wren-2026-employee-handbook-eb-signed.pdf#page=31","_blank")},
    {number:"04",title:"Local guest guide",copy:"Trusted dining, nature and cultural recommendations for the Hi-Desert.",meta:"Guest experience",action:()=>onView("Knowledge")},
    {number:"05",title:"Product & vendor library",copy:"Hotel items, storage locations, historical suppliers and order references.",meta:"478 imported records",action:()=>onView("Inventory")},
    {number:"06",title:"Shift standards",copy:"Morning and afternoon checklists with daily schedule and handoffs.",meta:"Team operations",action:()=>onView("Team")},
  ];
  return <><PageHead eyebrow="EMPLOYEE RESOURCES" title="Everything worth knowing, kept close."><button className="outline" onClick={()=>onView("Knowledge")}>Open field guide →</button></PageHead>
    <section className="handbook-feature"><div className="handbook-cover"><img src="/hotel-wren-wordmark-transparent.png" alt="Hotel Wren"/><span>EMPLOYEE HANDBOOK</span><strong>2026</strong><small>47 pages · personnel copy</small></div><div className="handbook-copy"><p className="eyebrow">FEATURED · ALL EMPLOYEES</p><h2>Hotel Wren<br/>Employee Handbook</h2><p>The current handbook covers company values, employment policies, payroll and timekeeping, safety, benefits, leaves of absence and the employee acknowledgment.</p><div className="resource-meta"><span><b>VERSION</b> 2026</span><span><b>FORMAT</b> PDF · 724 KB</span><span><b>ACCESS</b> Internal only</span></div><div className="handbook-actions"><a className="primary" href="/resources/hotel-wren-2026-employee-handbook-eb-signed.pdf" target="_blank" rel="noreferrer">Open handbook →</a><a href="/resources/hotel-wren-2026-employee-handbook-eb-signed.pdf" download>Download PDF ↓</a></div><small className="signed-notice">Signed personnel copy supplied by Eric Berry. Keep within the private employee portal.</small></div></section>
    <section className="resource-library"><div className="resource-library-head"><div><p className="eyebrow">QUICK ACCESS</p><h2>Guides for the work.</h2></div><span>Available to every employee role</span></div><div className="resource-grid">{resources.map(x=><button key={x.number} onClick={x.action}><span>{x.number}</span><h3>{x.title}</h3><p>{x.copy}</p><small>{x.meta}</small><b>Open →</b></button>)}</div></section>
  </>;
}

function Promotions({ notify }: { notify:(s:string)=>void }) { return <><PageHead eyebrow="PROMOTIONS · LIVE" title="Settle into Summer at Wren."><span className="live-offer">LIVE THROUGH SEPTEMBER 30</span></PageHead><section className="promotion-hero"><div><p className="eyebrow">ACTIVE OFFER · SUMMER 2026</p><h2>More time between<br/>sun and shade.</h2><p>20% off room rates, complimentary frozen fruit served poolside each afternoon, and late checkout all season long.</p><div className="offer-perks"><span><b>20%</b> off room rates</span><span><b>Daily</b> frozen fruit</span><span><b>Late</b> checkout</span></div></div><aside><p className="eyebrow">STAFF TALKING POINTS</p><ul><li>Book by July 11, 2026</li><li>Stay through September 30, 2026</li><li>Fully prepaid and non-refundable</li><li>Cannot combine with other offers</li><li>Subject to availability and blackout dates</li></ul><button className="primary" onClick={()=>notify("Offer details copied for guest reply")}>Copy guest-ready details →</button></aside></section><section className="promo-stats">{[["Promo code","SETTLE20"],["Bookings","18"],["Room nights","42"],["Revenue","$0"],["Avg. booking","$0"]].map(x=><article key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong></article>)}</section><p className="data-foot">Operational prototype only. Confirm final booking window, blackout dates, rate configuration, and channel availability in the approved PMS.</p></> }

function Maintenance({tickets,notify,openWorkOrder,updateTicket}:{tickets:MaintenanceTicket[];notify:(s:string)=>void;openWorkOrder:()=>void;updateTicket:(id:string,status:TicketStatus)=>void}) {
  const columns:TicketStatus[]=["Open","In progress","Verify","Recently completed"];
  const nextStatus:Record<TicketStatus,TicketStatus>={"Open":"In progress","In progress":"Verify","Verify":"Recently completed","Recently completed":"Open"};
  const actionLabel:Record<TicketStatus,string>={"Open":"Start work","In progress":"Send to verify","Verify":"Complete","Recently completed":"Reopen"};
  const advance=(ticket:MaintenanceTicket)=>{const status=nextStatus[ticket.status];updateTicket(ticket.id,status);notify(`${ticket.id} moved to ${status.toLowerCase()}`)};
  return <><PageHead eyebrow="MAINTENANCE" title="Preserve what guests feel."><button className="primary" onClick={openWorkOrder}>＋ Work order</button></PageHead><div className="kanban maintenance-history">{columns.map(status=>{const items=tickets.filter(ticket=>ticket.status===status);return <section className={status==="Recently completed"?"completed-column":""} key={status}><header><span>{status.toUpperCase()}</span><b>{items.length}</b></header>{items.map(ticket=><article key={ticket.id}><small>{ticket.location} · {ticket.id}</small><h3>{ticket.issue}</h3><p>{ticket.priority} priority · {ticket.guestImpact} guest impact</p><em>{ticket.assignedTo} · Updated {formatOperationalTime(ticket.updatedAt)}</em><div><span>{status==="Recently completed"?"✓":"△"}</span><button onClick={()=>advance(ticket)}>{actionLabel[status]} →</button></div></article>)}{!items.length&&<div className="kanban-empty">Nothing here.</div>}</section>})}</div></>;
}

function AlertsDrawerV2({guestRequests,shopOrders,handled,onHandle,close,openView}:{guestRequests:string[];shopOrders:string[];handled:string[];onHandle:(id:string)=>void;close:()=>void;openView:(view:View)=>void}) { const alerts=[...guestRequests.map(x=>({id:`guest-${encodeURIComponent(x)}`,tone:"urgent",eyebrow:"GUEST REQUEST · ROOM 05",title:x,meta:"Just now · On-property team notified",view:"Guests" as View})),...(shopOrders.length?[{id:`windsong-order-${shopOrders.length}`,tone:"urgent",eyebrow:"SHOP WINDSONG · ROOM 05",title:`${shopOrders.length} guest retail order${shopOrders.length===1?"":"s"} to prepare`,meta:`New · ${Array.from(new Set(shopOrders)).join(" · ")}`,view:"Inventory" as View}]:[]),{id:"inspect",tone:"care",eyebrow:"HOUSEKEEPING · ROOM 08",title:"Final inspection is ready",meta:"Submitted by Elena · 6 minutes ago",view:"Housekeeping" as View},{id:"inventory",tone:"watch",eyebrow:"HOTEL INVENTORY",title:"Mineral bath salt is below par",meta:"6 on hand · Par 24",view:"Inventory" as View},{id:"maintenance",tone:"care",eyebrow:"MAINTENANCE · ROOM 06",title:"Outlet replacement needs verification",meta:"Completed by Sam · 18 minutes ago",view:"Maintenance" as View}]; const active=alerts.filter(x=>!handled.includes(x.id)); return <div className="drawer-backdrop alert-backdrop" onClick={close}><aside className="alerts-drawer" onClick={e=>e.stopPropagation()}><button className="close" onClick={close}>×</button><p className="eyebrow">THE PROPERTY, NOW</p><h2>Alerts</h2><p className="alerts-intro">Only what needs a decision, a handoff or a thoughtful response.</p><div className="alert-summary"><strong>{active.length}</strong><span>open</span><small>{active.filter(x=>x.tone==="urgent").length} guest priority</small></div><div className="alert-list">{active.map(x=><article className={x.tone} key={x.id}><p>{x.eyebrow}</p><h3>{x.title}</h3><small>{x.meta}</small><div><button onClick={()=>onHandle(x.id)}>Mark handled</button><button onClick={()=>openView(x.view)}>Open →</button></div></article>)}{!active.length&&<div className="alerts-clear">Everything is in good hands.</div>}</div></aside></div> }

function WorkOrderDrawer({creator,close,created}:{creator:string;close:()=>void;created:(ticket:MaintenanceTicket)=>void}) {
  const [location,setLocation]=useState("Room 05");const [issue,setIssue]=useState("");const [priority,setPriority]=useState("Medium");const [guestImpact,setGuestImpact]=useState("None");const [assignedTo,setAssignedTo]=useState("Sam · Maintenance");
  const [id]=useState(()=>`WO-${String(Date.now()).slice(-5)}`);
  const submit=()=>{const now=new Date().toISOString();created({id,location,issue:issue.trim(),priority,guestImpact,assignedTo,status:"Open",createdAt:now,updatedAt:now})};
  return <div className="drawer-backdrop" onClick={close}><aside className="work-order-drawer" onClick={e=>e.stopPropagation()}><button className="close" onClick={close}>×</button><p className="eyebrow">NEW WORK ORDER · DRAFT</p><h2>What needs<br/>attention?</h2><div className="ticket-number">{id} <span>Created by {creator}</span></div><label>Location<select value={location} onChange={e=>setLocation(e.target.value)}>{["Room 01","Room 02","Room 03","Room 04","Room 05","Room 06","Room 07","Room 08","Room 09","Room 10","Room 11","Room 12","Pool","Lobby","Windsong","Garden","Wren House"].map(x=><option key={x}>{x}</option>)}</select></label><label>Issue<textarea value={issue} onChange={e=>setIssue(e.target.value)} placeholder="Describe what you observed…" /></label><div className="form-row"><label>Priority<select value={priority} onChange={e=>setPriority(e.target.value)}><option>Medium</option><option>Low</option><option>High</option><option>Urgent</option></select></label><label>Guest impact<select value={guestImpact} onChange={e=>setGuestImpact(e.target.value)}><option>None</option><option>Minor</option><option>Significant</option></select></label></div><label>Assign to<select value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}><option>Sam · Maintenance</option><option>General Manager</option><option>Approved vendor</option><option>Dana Ohaver</option></select></label><div className="drawer-actions"><button onClick={close}>Cancel</button><button className="primary" disabled={!issue.trim()} onClick={submit}>Create work order →</button></div></aside></div>;
}

function InventoryV2({ role, shopOrders, notify, openStockCount }: { role:string; shopOrders:string[]; notify:(s:string)=>void; openStockCount:()=>void }) {
  const [ordered,setOrdered]=useState<string[]>(()=>storedValue("nest-ordered-items",[]));
  const [toastStock,setToastStock]=useState<Record<string,"QUANTITY"|"OUT_OF_STOCK">>(()=>storedValue("nest-toast-stock",{"Two Deserts Soap":"QUANTITY","Canyon Coffee · Retail":"QUANTITY","Bellocq Tea Tin":"QUANTITY","Meditation Blanket":"QUANTITY"}));
  const [toastConnection,setToastConnection]=useState<"server ready"|"syncing"|"connected"|"setup needed">("server ready");
  const canOrder=role==="General Manager"||role==="Owner";
  const hotel=[["Mineral bath salt","6","24","Reorder","Housekeeping"],["Bellocq No. 45 tea","38","30","Healthy","Pantry"],["Canyon Coffee pouches","22","24","Watch","Pantry"],["Linen · King flat","41","36","Healthy","Laundry"],["Pool towels","28","32","Watch","Pool storage"]];
  const retailBase=[["Two Deserts Soap",String(Math.max(0,12-shopOrders.filter(item=>item==="Two Deserts Soap").length)),"12","Windsong"],["Canyon Coffee · Retail",String(Math.max(0,8-shopOrders.filter(item=>item==="Canyon Coffee Pouches").length)),"12","Windsong"],["Bellocq Tea Tin",String(Math.max(0,6-shopOrders.filter(item=>item==="Bellocq Tea Tin").length)),"10","Windsong"],["Meditation Blanket",String(Math.max(0,4-shopOrders.filter(item=>item==="Meditation Blanket").length)),"6","Windsong"]];
  const retail=retailBase.map(([name,onHand,par,location])=>[name,toastStock[name]==="OUT_OF_STOCK"?"0":onHand,par,toastStock[name]==="OUT_OF_STOCK"?"Out of stock":"Quantity",location]);
  useEffect(()=>{window.localStorage.setItem("nest-ordered-items",JSON.stringify(ordered))},[ordered]);
  useEffect(()=>{window.localStorage.setItem("nest-toast-stock",JSON.stringify(toastStock))},[toastStock]);
  const order=(item:string)=>{setOrdered(x=>Array.from(new Set([...x,item])));const queue=storedValue<Record<string,unknown>[]>("nest-purchasing-queue",[]);const createdAt=new Date().toISOString();window.localStorage.setItem("nest-purchasing-queue",JSON.stringify([{id:`PO-${createdAt}`,item,orderedBy:role,status:"Queued",createdAt},...queue]));notify(`${item} added to the approved purchasing queue`)};
  const updateToastStock=async(item:string)=>{
    const previous=toastStock[item];
    const next=toastStock[item]==="OUT_OF_STOCK"?"QUANTITY":"OUT_OF_STOCK";
    setToastStock(current=>({...current,[item]:next}));
    const quantity=Number(retailBase.find(row=>row[0]===item)?.[1]||1);
    try{
      const response=await fetch("/api/toast/stock",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:[{name:item,status:next,...(next==="QUANTITY"?{quantity}:{})}]})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Toast Stock update failed");
      setToastConnection("connected");
      notify(`${item} updated in Toast as ${next==="QUANTITY"?"quantity tracked":"out of stock"}`);
    }catch(error){setToastStock(current=>({...current,[item]:previous}));setToastConnection("setup needed");notify(error instanceof Error?error.message:"Toast Stock update failed")}
  };
  const syncToast=async()=>{
    setToastConnection("syncing");
    try{
      const response=await fetch("/api/toast/stock",{cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Toast Stock sync failed");
      const updates={...toastStock};
      data.items?.forEach((item:{name:string;status:"QUANTITY"|"OUT_OF_STOCK"|"IN_STOCK"})=>{if(item.name in updates)updates[item.name]=item.status==="OUT_OF_STOCK"?"OUT_OF_STOCK":"QUANTITY"});
      setToastStock(updates);setToastConnection("connected");notify(`Toast Stock synced · ${data.items?.length||0} items`);
    }catch(error){setToastConnection("setup needed");notify(error instanceof Error?error.message:"Toast Stock sync failed")}
  };
  const table=(items:string[][],toastManaged=false)=><section className="inventory-table"><div className="table-head"><span>ITEM</span><span>ON HAND</span><span>PAR</span><span>STATUS</span><span>LOCATION</span><span>ACTION</span></div>{items.map(r=><div className="table-row" key={r[0]}>{r.map((x,i)=><span key={i} className={i===3?x.toLowerCase().replaceAll(" ","-"):""}>{i===0?<><i className="item-icon">{r[0][0]}</i><strong>{x}</strong></>:x}</span>)}<span className="inventory-row-actions">{canOrder?<><button className={`order-now ${ordered.includes(r[0])?"ordered":""}`} disabled={ordered.includes(r[0])} onClick={()=>order(r[0])}>{ordered.includes(r[0])?"Ordered ✓":"Order now"}</button>{toastManaged&&<button className="toast-stock-toggle" onClick={()=>updateToastStock(r[0])}>{toastStock[r[0]]==="OUT_OF_STOCK"?"Restore in Toast":"Mark out in Toast"}</button>}</>:<small className="restricted-order">GM / OWNER</small>}</span></div>)}</section>;
  return <><PageHead eyebrow="INVENTORY" title="Enough, never excess."><button className="outline" onClick={openStockCount}>＋ Start stock count</button></PageHead><div className="inventory-section-head"><div><p className="eyebrow">HOTEL</p><h2>Guest rooms &amp; operations</h2></div><span>5 active items</span></div>{table(hotel)}<div className="inventory-section-head windsong"><div><p className="eyebrow">WINDSONG RETAIL</p><h2>The guest shop</h2></div><div className={`toast-stock-source ${toastConnection.replace(" ","-")}`}><span>TOAST STOCK · {toastConnection.toUpperCase()}</span><button disabled={toastConnection==="syncing"} onClick={syncToast}>{toastConnection==="syncing"?"Syncing…":"Sync now"}</button></div></div>{table(retail,true)}<p className="inventory-note">{canOrder?"Order now records an approved par-level purchase in The Nest. Vendor submission becomes automatic when the hotel’s vendor endpoints are connected. Windsong quantities and out-of-stock states are prepared for Toast’s server-side Stock API.":"Purchasing and Toast Stock updates are restricted to the General Manager and Owner."}</p><ProcurementCatalog notify={notify}/></>;
}

type ProcurementRecord={id:string;status:string;storage:string;retailer:string;item:string;qty:string;lastOrder:string;orderNumber:string;price:string;notes:string};

function ProcurementCatalog({notify}:{notify:(message:string)=>void}) {
  const [records,setRecords]=useState<ProcurementRecord[]>([]);
  const [query,setQuery]=useState("");
  const [location,setLocation]=useState("All locations");
  const [status,setStatus]=useState("Current + delivered");
  const [visible,setVisible]=useState(24);
  useEffect(()=>{fetch("/data/product-catalog.json").then(r=>r.json()).then(setRecords).catch(()=>setRecords([]))},[]);
  const locations=useMemo(()=>["All locations",...Array.from(new Set(records.map(x=>x.storage))).sort()], [records]);
  const filtered=useMemo(()=>records.filter(x=>{
    const haystack=`${x.item} ${x.retailer} ${x.storage} ${x.orderNumber}`.toLowerCase();
    const current=status==="All records"||!/(cancel|return|refund|sell)/i.test(x.status);
    return current&&(location==="All locations"||x.storage===location)&&haystack.includes(query.toLowerCase());
  }),[records,query,location,status]);
  const vendorUrl=(record:ProcurementRecord)=>`https://www.google.com/search?q=${encodeURIComponent(`${record.retailer} ${record.item}`)}`;
  return <section className="procurement-catalog"><div className="procurement-intro"><div><p className="eyebrow">HOTEL PRODUCT &amp; VENDOR LIBRARY</p><h2>What we use, where it lives, where it came from.</h2><p>{records.length?`${records.length} historical procurement records imported across ${locations.length-1} storage locations.`:"Loading the imported procurement library…"}</p></div><span>IMPORTED SOURCE · REVIEW BEFORE REORDERING</span></div>
    <div className="catalog-filters"><label>Search<input value={query} onChange={e=>{setQuery(e.target.value);setVisible(24)}} placeholder="Item, retailer, room or order number…"/></label><label>Storage<select value={location} onChange={e=>{setLocation(e.target.value);setVisible(24)}}>{locations.map(x=><option key={x}>{x}</option>)}</select></label><label>History<select value={status} onChange={e=>{setStatus(e.target.value);setVisible(24)}}><option>Current + delivered</option><option>All records</option></select></label></div>
    <div className="catalog-summary"><strong>{filtered.length}</strong><span>matching records</span><small>Confirm current SKU, price and lead time with the retailer before ordering.</small></div>
    <div className="catalog-table"><header><span>ITEM / RETAILER</span><span>STORAGE</span><span>QTY</span><span>LAST ORDER</span><span>STATUS</span><span /></header>{filtered.slice(0,visible).map(x=><article key={x.id}><span><strong>{x.item}</strong><small>{x.retailer} · Order {x.orderNumber}</small></span><span>{x.storage}</span><span>{x.qty}</span><span>{x.lastOrder}</span><span className="catalog-status">{x.status}</span><span><a href={vendorUrl(x)} target="_blank" rel="noreferrer" onClick={()=>notify(`${x.retailer} ordering source opened`)}>Find source ↗</a></span></article>)}</div>
    {!filtered.length&&records.length>0&&<div className="catalog-empty">No products match those filters.</div>}
    {visible<filtered.length&&<button className="catalog-more" onClick={()=>setVisible(x=>x+48)}>Show 48 more · {filtered.length-visible} remaining</button>}
  </section>;
}

function StockCountDrawer({creator,close,completed}:{creator:string;close:()=>void;completed:(variances:number)=>void}) { const items=[["Mineral bath salt","Housekeeping","6"],["Bellocq No. 45 tea","Pantry","38"],["Canyon Coffee pouches","Pantry","22"],["Linen · King flat","Laundry","41"],["Pool towels","Pool storage","28"]]; const date=localDateKey();const [counts,setCounts]=useState(items.map(x=>x[2]));const [storage,setStorage]=useState("All active locations");const [notes,setNotes]=useState("");const [id]=useState(()=>`SC-${date.replaceAll("-","")}-${String(Date.now()).slice(-3)}`);const variances=counts.filter((x,i)=>x!==items[i][2]).length;const save=(status:"Draft"|"Complete")=>{const history=storedValue<Record<string,unknown>[]>("nest-stock-count-history",[]);const record={id,date,creator,storage,notes,status,savedAt:new Date().toISOString(),items:items.map((item,i)=>({item:item[0],location:item[1],expected:item[2],counted:counts[i]}))};window.localStorage.setItem("nest-stock-count-history",JSON.stringify([record,...history.filter(item=>(item as {id?:string}).id!==id)]));if(status==="Complete")completed(variances);else close()};return <div className="drawer-backdrop" onClick={close}><aside className="work-order-drawer stock-drawer" onClick={e=>e.stopPropagation()}><button className="close" onClick={close}>×</button><p className="eyebrow">STOCK COUNT · {formatOperationalDate(date).toUpperCase()}</p><h2>Count what<br/>is here.</h2><div className="ticket-number">{id} <span>Started by {creator}</span></div><label>Storage area<select value={storage} onChange={e=>setStorage(e.target.value)}><option>All active locations</option><option>Housekeeping</option><option>Pantry</option><option>Laundry</option><option>Pool storage</option></select></label><div className="stock-list"><header><span>Item</span><span>Expected</span><span>Counted</span></header>{items.map((x,i)=><div key={x[0]}><span><strong>{x[0]}</strong><small>{x[1]}</small></span><b>{x[2]}</b><input aria-label={`${x[0]} counted quantity`} type="number" min="0" value={counts[i]} onChange={e=>{const n=[...counts];n[i]=e.target.value;setCounts(n)}} /></div>)}</div><label>Count notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Record damaged, expired, or relocated items…" /></label><div className="count-summary"><span>5 items counted</span><strong>{variances} variances</strong></div><div className="drawer-actions"><button onClick={()=>save("Draft")}>Save draft</button><button className="primary" onClick={()=>save("Complete")}>Complete stock count →</button></div></aside></div> }

function Financials() {
  const [period,setPeriod]=useState<"MTD"|"Forecast">("MTD");
  const departments=["Rooms","Windsong","Housekeeping","Maintenance","Marketing"];
  const exportReport=()=>{const rows=[["Hotel Wren financial workspace",period],["Metric","Value"],["Operating result","$0"],["Room revenue","$0"],["RevPAR","$0"],["Cash outlook","$0"],["Labor cost","0%"],[],["Department","Actual","Budget","Variance"],...departments.map(name=>[name,"$0","$0","$0"])];downloadText(`hotel-wren-financials-${period.toLowerCase()}-${localDateKey()}.csv`,rows.map(row=>row.map(value=>`"${value}"`).join(",")).join("\n"))};
  return <><PageHead eyebrow="FINANCIALS · AUTHORIZED VIEW" title="The shape of the month."><div className="finance-actions"><button onClick={exportReport}>Export report ↓</button><div className="segmented"><button className={period==="MTD"?"selected":""} onClick={()=>setPeriod("MTD")}>MTD</button><button className={period==="Forecast"?"selected":""} onClick={()=>setPeriod("Forecast")}>Forecast</button></div></div></PageHead><section className="finance-kpis">{[["Operating result","$0","0% vs plan"],["Room revenue","$0","0% vs plan"],["RevPAR","$0","0% vs forecast"],["Cash outlook","$0","30-day projected"],["Labor cost","0%","0 pts vs plan"]].map(x=><article key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong><span>{x[2]}</span></article>)}</section><div className="finance-dashboard"><section className="finance-hero"><div className="finance-title"><div><small>REVENUE VS. EXPENSES</small><h2>$0</h2><p>Total operating revenue · {period}</p></div><div className="finance-legend"><span><i/> Revenue</span><span><i/> Expenses</span></div></div><div className="dual-bars">{Array.from({length:12}).map((_,i)=><div key={i}><i style={{height:"0%"}}/><b style={{height:"0%"}}/></div>)}</div><div className="chart-labels"><span>{period==="MTD"?"JUL 01":"NEXT 30 DAYS"}</span><span>{period==="MTD"?"JUL 12":"OUTLOOK"}</span></div></section><section className="finance-panel revenue-mix"><div className="panel-head"><div><p className="eyebrow">REVENUE MIX</p><h3>Where it came from</h3></div><strong>$0</strong></div>{["Rooms","Windsong","Experiences","F&B + minibar","Other"].map(x=><div className="mix-row" key={x}><span>{x}</span><i><b style={{width:"0%"}}/></i><strong>$0</strong><small>0%</small></div>)}</section><section className="finance-panel budget"><div className="panel-head"><div><p className="eyebrow">BUDGET VS. ACTUAL</p><h3>Department view</h3></div><span>All departments</span></div><div className="finance-table"><header><span>Department</span><span>Actual</span><span>Budget</span><span>Variance</span></header>{departments.map(x=><div key={x}><span>{x}</span><span>$0</span><span>$0</span><span>$0</span></div>)}</div></section><section className="finance-panel approvals"><div className="panel-head"><div><p className="eyebrow">PAYABLES</p><h3>Awaiting approval</h3></div><span className="count">0</span></div><div className="empty-finance">No payables loaded.</div><div className="ap-total"><span>Accounts payable</span><strong>$0</strong></div></section><section className="finance-panel forecast"><div className="panel-head"><div><p className="eyebrow">30-DAY OUTLOOK</p><h3>Cash & occupancy</h3></div><span>Awaiting source data</span></div>{["Opening cash","Expected inflows","Committed outflows","Projected closing"].map(x=><div className="forecast-row" key={x}><span>{x}</span><strong>$0</strong></div>)}<div className="occupancy-outlook"><span>Forecast occupancy</span><strong>0%</strong><i><b style={{width:"0%"}}/></i></div></section></div><p className="data-foot">Financial values remain at $0 until an approved accounting connection is configured.</p></>;
}

function Knowledge() { const guides=[
  ["01","The Wren story","A 1940s roadside motel, once the Circle C Lodge, recontextualized by Manola Studio as a 12-room desert garden. The cactus wren—resilient, social, often seen in pairs—became the emblem for beauty and connection in harsh terrain.","HOTEL WREN · CLUB"],
  ["02","Room standards","All rooms are 450 sq ft, grounding and television-free, with vintage pieces, custom millwork, kitchenettes and private fireplace patios. Sunrise rooms are soft and reflective; midday rooms bold and linear; sunset rooms saturated and quiet.","HOTEL WREN · STAY"],
  ["03","Service principles","Greet warmly and personally. Notice before being asked. Own the whole problem. Create small, place-specific memories. Protect privacy. Help across roles. End every stay with genuine care—high-touch, never fussy.","ADAPTED FROM RITZ-CARLTON GOLD STANDARDS"],
  ["04","Room touchstones","Parachute linens and robes, Wonder Valley bath products, Canyon Coffee, Bellocq tea, yoga mat, meditation blanket, Klipsch speaker and an intentionally screen-free room. Placement should feel useful, never staged.","HOTEL WREN · STAY"],
  ["05","Windsong","Wren’s on-property bodega: practical provisions, goods and handcrafted objects selected to deepen a guest’s connection to the landscape. It should feel discovered—not merchandised—and remain welcoming to local visitors.","HOTEL WREN · PROPERTY"],
  ["06","Creative solitude","Make space to think: a pencil before a push notification, a lobby book before a television, a poolside conversation before programmed entertainment. Offer invitations, then let quiet do its work.","CLUB · HOTEL WREN"],
  ["07","Wren House","A restored two-bedroom, two-bath mid-century home on the property’s northwestern edge, overlooking open desert and the Pinto Mountains. Custom millwork, artisanal finishes, vintage furnishings and original details; available by request for considered gatherings.","HOTEL WREN · STAY"],
]; return <><PageHead eyebrow="THE WREN FIELD GUIDE" title="Hold the intention."><label className="search-field">⌕<input placeholder="Search the field guide…" /></label></PageHead><section className="knowledge-hero"><p className="eyebrow">HI-DESERT SERVICE</p><h2>Notice quietly.<br />Care completely.</h2><p>Be present, specific and unhurried.</p></section><div className="knowledge-grid detailed">{guides.map(x=><article key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p><small>{x[3]}</small></article>)}</div><section className="knowledge-dining"><p className="eyebrow">EAT &amp; DRINK · CONCIERGE NOTES</p><h2>Where to send them.</h2><DiningDirectory detailed/></section></> }
