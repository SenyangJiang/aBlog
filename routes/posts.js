var express = require('express');
var router = express.Router();

var cookieSession = require('cookie-session');

var Window = require('window');
var window = new Window();

var path = require('path');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var ObjectId = require('mongodb').ObjectID;

var postsdb;

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  postsdb = db.db("blogs");
});

router.use(cookieSession({keys:["fuck"], maxAge:10*60*1000}));

router.get('/', function(req, res, next) {
  var name = "";
  if(req.session!=null){name=req.session.username;}
  var objs = [];
  var cursor = postsdb.collection("posts").find();
  cursor.forEach(function(doc){
    objs.push(doc);
  }, function(){
    res.render('allposts',{objs:objs, name:name});
  });
});

router.post('/', async function(req, res, next) {
  var mybody = req.body;
  var idsearch = mybody.id;
  var usernamesearch = mybody.username;
  var promise;
  var postByID;
  var postsByUsername = [];
  if(idsearch.length==24){
    promise = postsdb.collection("posts").findOne({_id:ObjectId(idsearch)});
    await promise.then(function(msg){
      postByID=msg;
    });
    if(postByID!=undefined){
      res.redirect('/posts/'+idsearch);
    }
  }
  if(usernamesearch!=undefined){
    postsByUsername = await postsdb.collection("posts").find({username:usernamesearch}).toArray();
    console.log(postsByUsername);
    if(postsByUsername.length!=0){
      res.render('postsbyuser', {arr:postsByUsername, username:usernamesearch});
    }
  }
  res.render('goback', {errmsg:"ID and username not found."});
});


router.get('/add', function(req, res, next) {
  if(!req.session.username){res.render('goback', {errmsg:"Please Login First."});}
  else{
    res.render('addpost');
  }
});

router.post('/add', function(req, res, next) {
  var date = new Date();
  var bdy = req.body;
  bdy.username = req.session.username;
  bdy.date = date;
  console.log(req.session.username);
  postsdb.collection("posts").insert(bdy, function (){
    res.redirect('./');
  })
});

router.get('/delete', function(req, res, next) {
  if(!req.session.username){res.render('goback', {errmsg:"Please Login First."});}
  else{
    res.render('deleteinterface');
  }
});

router.post('/delete',function(req, res, next) {
  var mybdy = req.body;
  var id = mybdy.deleteID;
  var mpromise;
  var post;
  mpromise = postsdb.collection("posts").findOne({_id:ObjectId(id)});
  mpromise.then(function(doc){
    //console.log(mpromise);
    //console.log(doc);
    if(doc==null){
      res.render('goback', {errmsg:"ID Not Found."});
    }
    if(doc.username!=req.session.username){
      res.render('goback', {errmsg:"You can only delete your own posts."});
    }
    else{
      postsdb.collection("posts").remove({_id:ObjectId(id)}, function(){
        res.redirect('./');
      });
    }
  });
  //console.log(post);
  //console.log(post==null);


  /*
  postsdb.collection("posts").find({_id:ObjectId(id)}, function(doc){
    doc.forEach(function(doc){
      post.push(doc);
    });
    if(post.length==0){
      res.render('goback', {errmsg:"ID not found."});
    }
    if(post[0].username!=req.session.username){
      res.render('goback', {errmsg:"You can only delete your own posts."});
    }
    else{
      postsdb.collection("posts").remove({_id:ObjectId(id)}, function(){
        res.redirect('./');
      });
    }

  });
  //postsdb.collection("posts").remove({_id:ObjectId(id)}, function(){
    //res.redirect('./');
  //});
  */
});


router.get('/:id', function(req, res, next) {
  var myobj = [];
  var id = req.params.id;
  var cursor = postsdb.collection("posts").find({_id:ObjectId(id)});
  cursor.forEach(function(doc){
      myobj.push(doc);
    }, function(){
      if(myobj.length==0){
        res.redirect('./');
      }
      if(myobj.length!=0){
        res.render('onepost',{obj:myobj[0]});
      }
    });
});

router.get('/rm/:id', function(req, res, next) {
  if(!req.session.username){res.render('goback', {errmsg:"Please Login First."});}
  var id = req.params.id;
  var mpromise;
  mpromise = postsdb.collection("posts").findOne({_id:ObjectId(id)});
  mpromise.then(function(doc){
    if(doc.username!=req.session.username){
      res.render('goback', {errmsg:"You can only delete your own posts."});
    }
    else{
      postsdb.collection("posts").remove({_id:ObjectId(id)}, function(){
        res.redirect('/posts');
      });
    }
  });
});

module.exports = router;
