const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true
  }
};

const connection = {
  isConnected: false,
  pool: null,
  createConnection: async function() {
    if (this.pool == null) {
      try {
        console.log('creating connection');
        this.pool = await sql.connect(config);
        this.isConnected = true;
      } catch (error) {
        console.log(error);
        this.isConnected = false;
        this.pool = null;
      }
    }
  }
};

const Bit = sql.Bit;
const TinyInt = sql.TinyInt;
const SmallInt = sql.SmallInt;
const Int = sql.Int;
const BigInt = sql.BigInt;
const Varchar = (length) => sql.VarChar(length);
const NVarchar = (length) => sql.NVarChar(length);
const Decimal = (digits, precision) => sql.Decimal(digits, precision);
const Table = () => new sql.Table();

export {
  connection,
  Bit,
  TinyInt,
  SmallInt,
  Int,
  BigInt,
  Varchar,
  NVarchar,
  Decimal,
  Table
};