# Pattern: DBM slow query — artificial delay via pg_sleep
# Adapt: replace 'your_table' with a domain entity table
DB_URL = ENV.fetch("DATABASE_URL", "postgresql://demo:demo@postgresql:5432/demo")

def self.find_all_slow
  sql = "SELECT *, pg_sleep(0.3) FROM your_table ORDER BY created_at DESC LIMIT 50"
  ActiveRecord::Base.connection.execute(sql).to_a
end
