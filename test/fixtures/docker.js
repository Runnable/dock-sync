var app = module.exports = require('express')();

app.set('port', 3243);
app.use(app.router);

app.get('/images/json', function (req, res) {
  res.json([
    {
       "RepoTags": [
         "foo:other",
         "foo:latest"
       ],
       "Id": "8dbd9e392a964056420e5d58ca5cc376ef18e2de93b5cc90e868a1bbc8318c1c",
       "Created": 1365714795,
       "Size": 131506275,
       "VirtualSize": 131506275
    },
    {
       "RepoTags": [
         "bar:other",
         "bar:latest"
       ],
       "ParentId": "27cf784147099545",
       "Id": "b750fe79269d2ec9a3c593ef05b4332b1d1a02a62b4accb2c21d589ff2f5f2dc",
       "Created": 1364102658,
       "Size": 24653,
       "VirtualSize": 180116135
    },
    {
       "RepoTags": [
         "qux:other",
         "qux:latest"
       ],
       "ParentId": "27cf784147099545",
       "Id": "3d67245a8d72ecf13f33dffac9f79dcdf70f75acb84d308770391510e0c23ad0",
       "Created": 1364102658,
       "Size": 24653,
       "VirtualSize": 180116135
    }
  ]);
});

app.start = function () {
  app.listen(app.get('port'));
};