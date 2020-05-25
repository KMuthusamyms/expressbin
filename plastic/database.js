var sqlite3 = require('sqlite3').verbose()
const DBSOURCE = "dustbin"
let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.')
        db.run("CREATE TABLE user (phno TEXT, count int)",
        (err) => {
            if (err) {
                // Table already created
                console.log("Table Exist");
            }else{
                // Table just created, creating some rows
                console.log("Table created now");
            }
        });  
    }
});
module.exports = db