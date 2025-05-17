import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const scheduler = new ToadScheduler();

// MariaDB connection configuration
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT)
});

const task = new AsyncTask(
  'JOB1',
  async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query('CALL create__warehouse(\'Warehouse 1\', \'Stock\', 1, 0)');
      console.log('Job executed successfully:', result);
    } catch (error) {
      console.error('Error executing job:', error);
    } finally {
      if (conn) conn.release();
    }
  },
  (err: Error) => {
    console.error('Scheduler task error:', err);
  }
);

const job = new SimpleIntervalJob({ seconds: 5 }, task);

scheduler.addSimpleIntervalJob(job);

// Graceful shutdown
process.on('SIGINT', () => {
  scheduler.stop();
  pool.end();
  process.exit(0);
}); 