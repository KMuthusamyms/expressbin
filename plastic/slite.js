var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('dustbin');
var pcnt = 0;
//db.serialize(function () {
//   db.run("CREATE TABLE user (id INT, dt TEXT)");

//   var stmt = db.prepare("INSERT INTO user VALUES (?,?)");
//   for (var i = 0; i < 10; i++) {

//   var d = new Date();
//   var n = d.toLocaleTimeString();
//   stmt.run(i, n);
//   }
//   stmt.finalize();

//     db.each("SELECT id, dt FROM user", function (err, row) {
//         console.log("User id : " + row.id, row.dt);
//     });
// });
function dbschema() {
    db.serialize(function () {
        db.run("CREATE TABLE user (phno TEXT, count int)");
    });
}

function dbinsert(phno, cnt) {
    db.serialize(function () {
        var stmt = db.prepare("INSERT INTO user VALUES (?,?)");
        stmt.run(phno, cnt);
        stmt.finalize();
    });
}

function dbfetch(phno) {
    db.serialize(function () {
        //let s=db.run("SELECT phno, count FROM user WHERE phno='" + phno + "'");
        // db.all("SELECT phno, count FROM user WHERE phno='" + phno + "'", function(err, allRows) {

        //     if(err != null){
        //         console.log(err);
        //         callback(err);
        //     }

        //     console.log(util.inspect(allRows));

        //     callback(allRows);
        //     db.close();

        // });
        db.get("SELECT phno, count FROM user WHERE phno='" + phno + "'", (err, row)=>{
            console.log(row);
          });
        // db.each("SELECT phno, count FROM user WHERE phno='" + phno + "'", function (err, row) {
        //     if (err) {
        //         console.log(err)
        //     }
        //     return row;
        //     //console.log("User id : " + row.phno, row.count);
            // let dquery = "DELETE FROM USER WHERE phno='" + phno + "'";
            // db.run(dquery);
        // });
       
    });

}
//dbinsert('9655645698', 3)
dbfetch('8667663725');