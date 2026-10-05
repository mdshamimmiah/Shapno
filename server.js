import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({limit:"10mb"}));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive:true});
app.use("/uploads", express.static(uploadDir));

const outletSchema = new mongoose.Schema({
  code:{type:String,required:true,unique:true,trim:true},
  name:{type:String,required:true,trim:true},
  active:{type:Boolean,default:true}
},{timestamps:true});

const submissionSchema = new mongoose.Schema({
  outletCode:{type:String,required:true},
  outletName:{type:String,required:true},
  date:{type:String,required:true},
  photoUrl:{type:String,required:true},
  submittedAt:{type:Date,default:Date.now}
},{timestamps:true});

let Outlet, Submission;
let memoryOutlets = [
  {code:"F024",name:"Tangail Express Outlet",active:true},
  {code:"F096",name:"Tangail Mainroad Outlet",active:true},
  {code:"F179",name:"Tangail Sabalia Outlet",active:true},
  {code:"F712",name:"Bazar Road Elenga Outlet",active:true},
  {code:"F877",name:"Nagarpur Outlet",active:true}
];
let memorySubmissions = [];

async function connectDB(){
  if(!process.env.MONGODB_URI){
    console.log("MongoDB URI not configured. Running in demo memory mode.");
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI);
  Outlet = mongoose.model("Outlet", outletSchema);
  Submission = mongoose.model("Submission", submissionSchema);
  console.log("MongoDB connected.");
}

const storage = multer.diskStorage({
  destination:(req,file,cb)=>cb(null,uploadDir),
  filename:(req,file,cb)=>{
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g,"_");
    cb(null,Date.now()+"-"+safe);
  }
});
const upload = multer({storage});

app.get("/api/health",(req,res)=>res.json({ok:true,message:"Backend is running"}));

app.get("/api/outlets",async(req,res)=>{
  try{
    const outlets = Outlet ? await Outlet.find({active:true}).sort({code:1}) : memoryOutlets.filter(o=>o.active);
    res.json(outlets);
  }catch(e){res.status(500).json({message:e.message});}
});

app.post("/api/outlets",async(req,res)=>{
  try{
    const code=String(req.body.code||"").trim().toUpperCase();
    const name=String(req.body.name||"").trim();
    if(!code||!name)return res.status(400).json({message:"Outlet code and name are required"});
    if(Outlet){
      const exists=await Outlet.findOne({code});
      if(exists)return res.status(409).json({message:"Outlet code already exists"});
      const outlet=await Outlet.create({code,name});
      return res.status(201).json(outlet);
    }
    if(memoryOutlets.some(o=>o.code===code))return res.status(409).json({message:"Outlet code already exists"});
    const outlet={code,name,active:true}; memoryOutlets.push(outlet); res.status(201).json(outlet);
  }catch(e){res.status(500).json({message:e.message});}
});

app.put("/api/outlets/:code",async(req,res)=>{
  try{
    const oldCode=req.params.code;
    const name=String(req.body.name||"").trim();
    const newCode=String(req.body.code||oldCode).trim().toUpperCase();
    if(!name||!newCode)return res.status(400).json({message:"Code and name are required"});
    if(Outlet){
      const outlet=await Outlet.findOneAndUpdate({code:oldCode},{code:newCode,name},{new:true});
      if(!outlet)return res.status(404).json({message:"Outlet not found"});
      return res.json(outlet);
    }
    const i=memoryOutlets.findIndex(o=>o.code===oldCode);
    if(i<0)return res.status(404).json({message:"Outlet not found"});
    memoryOutlets[i]={...memoryOutlets[i],code:newCode,name};
    res.json(memoryOutlets[i]);
  }catch(e){res.status(500).json({message:e.message});}
});

app.delete("/api/outlets/:code",async(req,res)=>{
  try{
    const code=req.params.code;
    if(Outlet){
      const outlet=await Outlet.findOneAndUpdate({code},{active:false},{new:true});
      if(!outlet)return res.status(404).json({message:"Outlet not found"});
      return res.json({message:"Outlet deactivated"});
    }
    const i=memoryOutlets.findIndex(o=>o.code===code);
    if(i<0)return res.status(404).json({message:"Outlet not found"});
    memoryOutlets[i].active=false;
    res.json({message:"Outlet deactivated"});
  }catch(e){res.status(500).json({message:e.message});}
});

app.post("/api/submissions",upload.single("photo"),async(req,res)=>{
  try{
    const {outletCode,date}=req.body;
    if(!outletCode||!date||!req.file)return res.status(400).json({message:"Outlet, date and photo are required"});
    let outlet;
    if(Outlet) outlet=await Outlet.findOne({code:outletCode,active:true});
    else outlet=memoryOutlets.find(o=>o.code===outletCode&&o.active);
    if(!outlet)return res.status(404).json({message:"Outlet not found"});
    const photoUrl=`/uploads/${req.file.filename}`;
    if(Submission){
      const s=await Submission.create({outletCode,date,outletName:outlet.name,photoUrl});
      return res.status(201).json(s);
    }
    const s={outletCode,date,outletName:outlet.name,photoUrl,submittedAt:new Date().toISOString()};
    memorySubmissions.push(s); res.status(201).json(s);
  }catch(e){res.status(500).json({message:e.message});}
});

app.get("/api/submissions",async(req,res)=>{
  try{
    const date=String(req.query.date||"");
    if(!date)return res.status(400).json({message:"date is required"});
    const items=Submission ? await Submission.find({date}).sort({outletCode:1}) : memorySubmissions.filter(s=>s.date===date);
    res.json(items);
  }catch(e){res.status(500).json({message:e.message});}
});

connectDB().then(()=>{
  app.listen(PORT,()=>console.log(`Backend running on http://localhost:${PORT}`));
}).catch(e=>{
  console.error("Database connection failed:",e.message);
  process.exit(1);
});