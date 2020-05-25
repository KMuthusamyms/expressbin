var https = require('https');
var express = require("express");
var apirequest = require("request");
var Gpio = require('pigpio').Gpio;
var app = express();
//var piblaster = require('pi-blaster.js');
var sqlite3 = require('sqlite3').verbose();
//var db = new sqlite3.Database('dustbin');
var db = require('./database.js')
let bottlecount = 0;
var door = 0;
app.use(express.static('public'));
app.use('/model', express.static(__dirname + '/model_data'));
app.use('/node', express.static(__dirname + '/node_modules'));
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/home', express.static(__dirname + '/public'));
app.get('/customer/:phno/:choice/:count', function (req, res) {
    let phno = req.params.phno;
    let choice = req.params.choice;
    let count=req.params.count;
    //let count = bottlecount;
    let message = "";
    let amount = count * 10;
    console.log(phno, choice, count);
    if (choice != 'option4') {
        if (choice == 'option1') {
            let r = Math.random().toString(36).substring(6);
            message = "THANKS FOR RECYCLING PLASTICS. YOUR COUPON CODE IS " + r + ". COUPON CODE WORTH ₹" + amount + ". ";
        } else if (choice == 'option2') {
            message = "THANKS FOR RECYCLING PLASTICS. YOUR PHONE NUMBER WAS RECHARGED OF ₹" + amount + ".";
        } else {
            message = "THANKS FOR RECYCLING PLASTICS. THANKS FOR DONATING ₹" + amount + " TO CHILDEREN'S EDUCATION";
        }
        let link = encodeURI("http://<smslink>?msg=" + message + "&num=" + phno);
        console.log(link);
        apirequest.get(link, (error, response, body) => { });
    } else {

    }
    let data = { 'message': 'received successfully' };
    res.status(201);
    res.send(data);
});
//lock rest get call
app.get('/lock', function (req, res) {
    new Gpio(21, { mode: Gpio.OUTPUT }).servoWrite(2000);
    door = 0;
    console.log('Box locked');
    res.end('Box is locked');
});

//unlock rest get call
app.get('/unlock', function (req, res) {
    //piblaster.setPwm(26, 0.1);
    new Gpio(21, { mode: Gpio.OUTPUT }).servoWrite(1000);
    door = 1;
    console.log('Box unlocked');
    res.end('Box is unlocked');
});

app.get('/ultrasonic', function (req, res) {
    ultrasonic();
    res.end('ultrasonic initiated');
});

app.get('/bottlecnt', function (req, res) {
    let data = { 'count': bottlecount };
    res.send(data);
});

app.get('/reset', function (req, res) {
    bottlecount = 0;
    res.end('app resetted');
});

app.get('/save/:phno/:count', function (req, res) {
    console.log(req.params.phno, req.params.count);
    db.serialize(function () {
        var stmt = db.prepare("INSERT INTO user VALUES (?,?)");
        stmt.run(req.params.phno, req.params.count);
        stmt.finalize();
        res.end('Inserted');
    });
    res.end('Finished');
});

app.get('/fetch/:phno', function (req, res, next) {
    var sql = "SELECT phno, count FROM user WHERE phno='" + req.params.phno + "'"
    var params = []
    db.get(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        let dquery = "DELETE FROM USER WHERE phno='" + req.params.phno + "'";
        db.run(dquery);
        res.json({
            "message": (rows==undefined)?"No Data":"success",
            "count": rows
        })
    });
});

app.get('/console/:data', function (req, res) {
    console.log(req.params.data);
    res.end('printed');
});

// Express route for any other unrecognised incoming requests
app.get('*', function (req, res) {
    res.status(404).send('Unrecognised API call');
});
// Express route to handle errors
app.use(function (err, req, res, next) {
    if (req.xhr) {
        res.status(500).send('Oops, Something went wrong!');
    } else {
        next(err);
    }
});
// Start Express App Server
var server = app.listen(8080, '0.0.0.0', function () {
    var port = server.address().port;
    console.log("Server started at http://localhost:%s", port);
    ultrasonic();
});
//on clrl-c, put stuff here to execute before closing your server with ctrl-c
process.on('SIGINT', function () {
    var i;
    console.log("\nGracefully shutting down from SIGINT (Ctrl+C)");
    process.exit();
});

function ultrasonic() {
    init_value = 0;
    count = 0;
    distance = 0;
    inc = 0;
    const MICROSECDONDS_PER_CM = 1e6 / 34321;
    const trigger = new Gpio(16, { mode: Gpio.OUTPUT });
    const echo = new Gpio(20, { mode: Gpio.INPUT, alert: true });
    trigger.digitalWrite(0); // Make sure trigger is low
    const watchHCSR04 = () => {
        let startTick;
        echo.on('alert', (level, tick) => {
            if (level == 1) {
                startTick = tick;
            } else {
                const endTick = tick;
                const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
                let d = diff / 2 / MICROSECDONDS_PER_CM;
                //console.log(d);
                if (count == 0) {
                    init_value = d;
                    count++;
                }
                else {
                    if (count < 3) {
                        if (d == init_value) {
                            count++;
                            distance = d;
                        } else {
                            count = 0;
                            init_value = d;
                        }
                    } else {
                        //console.log(door);
                        if ((door == 1) && (d < distance - 1)) {
                            bottlecount++;
                            console.log("increase");
                            //console.log(bottlecount);
                        }
                    }
                }
            }
        });
    };

    watchHCSR04();
    ultra = setInterval(() => {
        trigger.trigger(10, 1);
    }, 50);
}
