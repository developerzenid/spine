let mongoose =require('mongoose');
//connection
mongoose.connect("mongodb+srv://spine:spine@cluster0.cgkeyuo.mongodb.net/spine",{
    useUnifiedTopology: true,
     useNewUrlParser: true,
    }).
then( ()=> console.log("connect is successfully"))
.catch((err)=>
console.log("Something Went Wrong",err)
)

