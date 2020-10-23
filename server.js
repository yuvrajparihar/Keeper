const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
var cors = require("cors")
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000
app.use(cors());
app.use(bodyParser.json()) 
// app.use(bodyParser.urlencoded({ extended: true }));





mongoose.connect("mongodb+srv://yuvrajparihar:Webdev292@cluster0.zyfyw.mongodb.net/keeperDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});



const itemSchema={
    title:String,
    content:String
}

const items = mongoose.model("item",itemSchema);

// const item = new items({
//     title:"ram lal",
//     content:"kalu b sadf dfafda dadf"
// })

// item.save();


app.route("/").get(function(req,res){
 
  items.find(function(err,found){
      if(err){
          console.log(err)
      }
      else{
          if(found){
            //   console.log(found[0])
              res.send(found)
          }
      }
  })

   
});
// console.log(JSON.stringify({ title: 'React Hooks POST Request Example' }))
app.post("/add",function(req, res){
    const title = req.body.title;
    const content = req.body.content;
  
    const newItem = new items({
    title:title,
    content:content
})

newItem.save();

   res.redirect("/")

})

app.post("/delete",function(req, res){

   const deleteId = req.body.id;

   items.findByIdAndRemove(deleteId,function(err){
       if(err){
           console.log(err)
       }
   })
   res.redirect("/");

    // console.log(req.body)
    // res.send({"hello":"world"})
})



app.listen(PORT,function(){
    console.log("server is listening on 5000")
})
