import db from "../../config/db.js";

const createBusiness = async ({ name, email, phone, type }) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO business ( name, email, phone, type, ) values (?,?,?,?)`,
      [name, email, phone, type],
      function (err) {
        if (err) return reject(err);
        resolve({
          id: this.lastID,
          name,
          email,
          phone,
          type,
        });
      },
    );
  });
};
