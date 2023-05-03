const express = require('express');
const { exec } = require('child_process');
const port = process.argv[2];
const app = express();

app.get('/start-nodes', (req, res) => {
    res.sendFile(__dirname + '/web-interface/index.html');
    
});
app.get('/start-node1', (req, res) => {
    exec('npm run node_1', (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return res.status(500).send('An error occurred');
      }
      console.log(stdout);
      console.error(stderr);
      res.send('Command executed successfully');
    });
  });
  app.get('/start-node2', (req, res) => {
    exec('npm run node_2', (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return res.status(500).send('An error occurred');
      }
      console.log(stdout);
      console.error(stderr);
      res.send('Command executed successfully');
    });
  });
  app.get('/start-node3', (req, res) => {
    exec('npm run node_3', (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return res.status(500).send('An error occurred');
      }
      console.log(stdout);
      console.error(stderr);
      res.send('Command executed successfully');
    });
  });
  app.get('/start-node4', (req, res) => {
    exec('npm run node_4', (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return res.status(500).send('An error occurred');
      }
      console.log(stdout);
      console.error(stderr);
      res.send('Command executed successfully');
    });
  });
  app.get('/start-node5', (req, res) => {
    exec('npm run node_5', (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return res.status(500).send('An error occurred');
      }
      console.log(stdout);
      console.error(stderr);
      res.send('Command executed successfully');
    });
  });
app.listen(port, function(){
    console.log(`Listening on port ${port}...`);
});



// exec('npm run node_2', (err, stdout, stderr) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send('An error occurred');
//     }
//     console.log(stdout);
//     console.error(stderr);
//     res.send('Command executed successfully');
//   });