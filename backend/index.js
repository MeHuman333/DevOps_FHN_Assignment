// import path from 'path';
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = express();
require("dotenv").config();

// const PORT = 4000;
const SECRET = 'abcd1589qwerty';

const http = require('http').Server(app);
const cors = require('cors');

app.use(express.json());

const PORT=process.env.PORT || 3000;
const URL=process.env.URL;

// const __dirname=path.resolve();

// app.options("",cors({
//     origin:"*",
//     credential:true,
//     methods:["GET","POST","PUT","DELETE"]
// }))

app.use(cors({
    origin:"*",
    credentials:true,
    methods:["GET","POST","PUT","DELETE"]
}));

app.all((req, res, next) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
      )
    next();
  });

mongoose.connect(URL).then(()=>{console.log('mongodb  connected')})

function checkIds(data,array){
    let found=false;
    for(let i=0;i<array.length;i++){
        if(array[i].name===data.name){
            array[i]=data;
            found=true;
            break;
        }
    }
    if(!found){
        array.push(data)
    }
}


function findRecipient(value,array){
    for(let i=0;i<array.length;i++){
        if(array[i].name===value.to){
            return array[i].id;
        }
    }
}

function findUser(value,arr){
    for(let i=0;i<arr.length;i++){
        if(value===arr[i].name){
            return arr[i];
        }
    }
    return null;
}

function findIndex(value,arr){
    for(let i=0;i<arr.length;i++){
        if(arr[i].sender===value.sender && arr[i].reciever===value.reciever){
            return i;
        }
    }
}
//adding message to database below
// function addMessage(data,array){
    
//     for(let i=0;i<array.length;i++){
//         if(array[i].name===data.from){
//             // addMessage(data.to,array[i].friendList)
//             for(let z=0;z<array[i].friendList.length;z++){
//                 if(data.to===array[i].friendList.name){
//                     array[i].friendList.chats.push(data);
//                 }
//             }
//         }
//     }
// }


// const userList=[
//     {index:0,name:'Subham',friendList:[{index:0 ,name:"Sattwik",chats:[]},{index:1 ,name:"Ayush",chats:[]}]},
//     {index:1,name:'Sattwik',friendList:[{index:0 ,name:"Subham",chats:[]},{index:1 ,name:"Sharvil",chats:[]}]}
// ]

const userSchema=new mongoose.Schema({
    name: String,
    password: String,
    friendList: [{
        index: Number,name: String,chats: [{from: String,to: String,message: String}]
    }],
    friendReq: [{sender: String,reciever: String}]
});

const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
  };

const socketIds=[];

const userlist = mongoose.model('userlist',userSchema);

// const chats= [{name:'Subham',message:"hello hru"},{name:'Ayush',message:"kya kr he ho"},{name:'Subham',message:"hello hru"},{name:'Subham',message:"hello hru"},{name:'Subham',message:"hello hru"},{name:'Subham',message:"hello hru"},{name:'Subham',message:"hello hru"}];

const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods:["GET","OPTIONS","PATCH","DELETE","POST","PUT"],
        credentials:true
    }
});
app.use(cors());

// app.use(cors({
//     origin:["https://hello-chat-silk.vercel.app"],
//     methods:["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
//     credentials:true
// }));

app.get('/',(req,res)=>{
    res.send("yoo");
})

app.get('/users',authenticateJwt,async (req,res)=>{
    let username=req.headers.username;
    let user=await userlist.findOne({name:username});console.log(user);
    if(user){
        res.send(user.friendList);
    }else{
        res.status(404).send("not found");
    }
    // console.log(x)   
    // let a=findUser(x,userList);
    // console.log(a.friendList);

    // res.send(a.friendList);
})

// app.post('/getusers',(req,res)=>{
//     const username=req.headers.
// })

app.get('/chats',(req,res)=>{
    res.send(chats);
})

let z=5;
app.post('/adduser',async (req,res)=>{
    // let user={index:z,name:req.headers.name,chats:[]};
    // friendList.push(user);
    // z++;
    // res.send('User added');
    let q=req.headers.name;
    const newUser=await userlist.create({
        name: q,
        password:req.headers.password,
        friendList: []
    })

    const token=jwt.sign({username:q}, SECRET, {expiresIn: '1h'});
    res.json({message:"done",token});
})

app.post('/login',async (req,res)=>{
    let found=await userlist.findOne({name:req.headers.name,password:req.headers.password});
    if(found){
        const token = jwt.sign({ name:req.headers.name }, SECRET, { expiresIn: '1h' });
        
        res.json({message:'Logged in successfully',token});
    }else{
        res.json({message:'Invalid Credentials'})
    }
})

app.post('/acceptingfriendreq',authenticateJwt,async (req,res)=>{
    let sender1 = await userlist.findOne({name:req.headers.sender});
    let reciever1 = await userlist.findOne({name:req.headers.reciever});

    // await sender1.friendReq.findOneAndDelete({sender:req.headers.sender,reciever:req.headers.reciever});

    // await reciever1.friendReq.findOneAndDelete({sender:req.headers.sender,reciever:req.headers.reciever});

    let a=findIndex(req.headers,sender1.friendReq);
    let b=findIndex(req.headers,reciever1.friendReq);

    sender1.friendReq.splice(a,1);
    reciever1.friendReq.splice(b,1);

    sender1.friendList.push({name:req.headers.reciever,chats:[]});

    reciever1.friendList.push({name:req.headers.sender,chats:[]})  

    await sender1.save();
    await reciever1.save();

    res.send("added in friendlist")
})

// io.on("connection",(socket)=>{
//     console.log(`User connected ${socket.id}`);
//     socket.on('join-room',(value)=>{
//         // roomID=value;
//         socket.join(value);
//     })
//     socket.on('message',({message,room})=>{
//         console.log(message);
        
//         io.to(room).emit('receive-message',message);
//     })  

// })

app.post('/sendingfriendreq',authenticateJwt,async (req,res)=>{
    let sender = await userlist.findOne({name:req.headers.sender});
    let reciever = await userlist.findOne({name:req.headers.reciever});

    if(sender && reciever){
        sender.friendReq.push({sender:req.headers.sender,reciever:req.headers.reciever});
        reciever.friendReq.push({sender:req.headers.sender,reciever:req.headers.reciever});
        await sender.save();
        await reciever.save();
        
        res.send('friend req sent');
    }
})

app.post('/gettingreqsreceived',authenticateJwt,async (req,res)=>{
    let q=req.headers.name;
    let z=await userlist.findOne({name:req.headers.name});
    if(z){
        res.send(z.friendReq);
    }
})

io.on('connection',(socket)=>{
    console.log(`User connected ${socket.id}`);

    socket.on('sending-id',(info)=>{
        checkIds(info,socketIds);
        console.log(socketIds);
    })

    socket.on('sending-mssg',(async (data)=>{
        // let datas={"name":data.from,"id":data.id}
        // checkIds(datas,socketIds);
            //  console.log(socketIds);  

        // let destination=findRecipient(data,socketIds);
        // console.log(destination);

        // console.log(data.id);

        // io.to(destination).to(data.id).emit('recieve-message',{"from":data.from,"to":data.to,"message":data.message});

        // addMessage(data,userList)

        //for sender chat update in mongodb
        let sender=await userlist.findOne({name:data.from});
        if(sender){
            sender.friendList.forEach((friend)=>{
                if(friend.name===data.to){
                    friend.chats.push(data);
                }
            })
        }
        await sender.save();
        //for reciever chat update in mongodb
        let reciever=await userlist.findOne({name:data.to});
        if(reciever){
            reciever.friendList.forEach((friend)=>{
                if(friend.name===data.from){
                    friend.chats.push(data);
                }
            })
        }
        await reciever.save();

        let destination=await findRecipient(data,socketIds);

        io.to(destination).to(data.id).emit('recieve-message',{"from":data.from,"to":data.to,"message":data.message});

        // console.log(data)
        //after emit, in client side,  recieve message and push to message data where from =user name;

        //update database
    }))
})

// app.use(express.static(path.join(__dirname,"/frontend/dist")))

// app.get("*",(req,res)=>{
//     res.sendFile(path.join(__dirname,"frontend","dist","index.html"))
// })
module.exports = { checkIds, findRecipient, findUser, findIndex };

http.listen(PORT ,()=>{console.log("server running on port 3000")});


//dotenv
//urls
