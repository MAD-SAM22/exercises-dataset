const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Exercises API Server is running on port ${PORT}`);
  console.log(`👉 http://localhost:${PORT}/exercises`);
});
