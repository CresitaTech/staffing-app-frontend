const express = require('express');

const port = 4202;

const app = express()
app.use(express.static(__dirname + 'D:/Opallios/staffing-app-front-end-development/dist/staffing-app'));
app.get('*', function (req, res) {
    // Use res.sendfile, as it streams instead of reading the file into memory.
    res.sendFile(__dirname + 'D:/Opallios/staffing-app-front-end-development/dist/staffing-app/index.html');
});

app.listen(port, () => console.log('Example app listening on port ' + port));


