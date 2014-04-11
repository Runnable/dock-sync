var app = require('express')();

app.set('port', 3040);
app.use(app.router);

app.get('/v1/respositories/:namespace/:repository/tags', function (req, res) {
  if (req.params.repository === 'foo') {
    res.json({
      "latest": "8dbd9e392a964056420e5d58ca5cc376ef18e2de93b5cc90e868a1bbc8318c1c"
    });
  }
  else if (req.params.repository === 'bar') {
    res.json({
      "latest": "9e89cc6f0bc3c38722009fe6857087b486531f9a779a0c17e3ed29dae8f12c4f",
      "0.1.1":  "b750fe79269d2ec9a3c593ef05b4332b1d1a02a62b4accb2c21d589ff2f5f2dc"
    });
  }
  else if (req.params.repository === 'qux') {
    res.json({
      "latest": "aeee63968d87c7da4a5cf5d2be6bee4e21bc226fd62273d180a49c96c62e4543",
      "0.1.1":  "6ab5893c6927c15a15665191f2c6cf751f5056d8b95ceee32e43c5e8a3648544"
    });
  }
  else {
    res.send(404);
  }
});

app.start = function () {
  app.listen(app.get('port'));
};