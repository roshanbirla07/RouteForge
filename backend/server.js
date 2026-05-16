const express = require('express');
const cors = require('cors');
const routeRouter = require('./routes/routeRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/route', routeRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({ error: message });
});

app.listen(port, () => {
  console.log(`RouteForge backend listening on port ${port}`);
});

app.get('/',(req,res)=>{
  res.send("server is running fine ");
});
