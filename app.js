
var express= require("express");
var bodyparser= require("body-parser");
var mongoose= require("mongoose");
var passport= require("passport");
var LocalStrategy= require("passport-local");
var localmongoose= require("passport-local-mongoose");
var flash= require("connect-flash");
var app=express();


app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
//mongoose.connect("mongodb://localhost/clg_project",{ useNewUrlParser: true });
mongoose.connect("mongodb+srv://Alok-laha:alok98@2404@query-sf4gd.mongodb.net/test?retryWrites=true&w=majority", {useNewUrlParser:true});
app.use(flash());

app.use(require("express-session")({
    secret: "This is college project",
    resave: false,
    saveUninitialized: false
}));


var userSchema= new mongoose.Schema({
    username:{
        type: String
    },
    password:{
        type: String
    }
});
userSchema.plugin(localmongoose);

var User= mongoose.model("User",userSchema);

var questionSchema= new mongoose.Schema({
   questions:{
       type: String
   },
    answers:{
        type: String
    }
});

var Question= mongoose.model("Question", questionSchema);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You have to login first");
    res.redirect("/home/login");
}

app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

 app.listen(3000,function(){
 	console.log("college_server has started");
 });
app.get("/",function(req,res){
   res.render("landing"); 
});
app.get("/home", function(req,res){
    req.flash("success","Welcome to our forum");
	res.render("home");
});

app.get("/home/question",isLoggedIn,function(req,res){
    res.render("question");
});

 app.get("/home/signup",function(req,res){
 	if(req.user){
         req.flash("success","you are already logged in!!");
         res.redirect("back");
     } else{
         res.render("signup");
     }
 });

app.post("/home/signup",function(req,res){
    var newUser= new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err,user){
        if(err){
            console.log(err);
            req.flash("error",err.message);
            return res.redirect("/home/signup");
        }
        passport.authenticate("local")( req, res, function(){
            req.flash("success","Successfully Registered");
            res.redirect("/home");
        });
    });
});

 app.get("/home/login",function(req,res){
     if(req.user){
         req.flash("success","you are already logged in!!");
         res.redirect("back");
     } else{
         res.render("login");
     }
 });

app.post("/home/login",
         passport.authenticate("local",
                               {successRedirect: "/home",
                                failureRedirect: "/home/login"}),
         function(req,res){
});
app.get("/home/logout",function(req,res){
    req.logout();
    req.flash("success","Successfully Logged out");
    res.redirect("/home");
})
app.get("/home/allquestions",isLoggedIn,function(req,res){
    Question.find({},function(err,found){
        if(err){
            console.log(err);
        }
        else{
            res.render("show",{allques: found});
        }
    })
});
app.get("/home/allquestions/:id/answer",isLoggedIn,function(req,res){
        Question.findById(req.params.id, function(err,foundanswer){
        if(err){
            console.log(err)
        }
        else{
            res.render("answer",{edited: foundanswer});
        }
    }) 
});

app.get("/home/allquestions/:id/edit",isLoggedIn,function(req,res){
    if(req.user.username==="Alok"){
     Question.findById(req.params.id, function(err,editanswer){
        if(err){
            console.log(err)
        }
        else{
            res.render("edit",{update: editanswer});
        }
    })
        } else{
              req.flash("error","You do not have permission to do that");
              res.redirect("back");
    }

});
 app.post("/home/allquestions/:id/edit", isLoggedIn,function(req,res){
//     question.findByIdAndUpdate(req.params.id,answer, function(err,newanswer){
//         if(err){
//             console.log(err)
//         }
//         else{
//             console.log(newanswer);
//             res.redirect("/home/allquestions")
//         }
     if(req.user.username==="Alok"){
      var myquery = { _id: req.params.id };
     var newvalues = { $set: {answers: req.body.ans } };
     Question.updateOne(myquery, newvalues, function(err, newanswer) {
    if (err){
        console.log(err);
        req.flash("error","Something went wrong!! Please try again!!");
        res.redirect("/home/allquestions/:id/edit");
    }
    else{
        console.log(newanswer);
        req.flash("success","Successfully added your answer");
         res.redirect("/home/allquestions");
    }
         
  });
          } else{
              req.flash("error","You do not have permission to do that");
        res.redirect("back");
    }
     });

app.post("/home/question", isLoggedIn ,function(req,res){
    var question=req.body.ques;
    var ques={questions: question, answers: null};
    Question.create(ques, function(err,newquestion){
        if(err){
            console.log(err);
            req.flash("error","Something went wrong!!  Please try again!!");
            res.redirect("/home/question");
        }
        else{
            console.log(newquestion);
            newquestion.save();
            req.flash("success","Successfully posted your question");
            res.redirect("/home/allquestions");
        }
    })
});

app.get("*",function(req,res){
    res.send("Page not found!!");
});