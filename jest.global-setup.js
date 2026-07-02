// Pin the timezone so date-based snapshots match on any machine (and in CI)
module.exports = async () => {
  process.env.TZ = 'UTC';
};
