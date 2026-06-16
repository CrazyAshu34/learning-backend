import db from "../../config/db.js";

const dropTable = () => {
  db.run(`DROP TABLE IF EXISTS businesses`, function(err) {
    if (err) {
      console.error('Error dropping table:', err.message);
    } else {
      console.log('✅ Table "businesses" has been dropped successfully.');
    }
  });
};

export default dropTable;