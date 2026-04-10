# Pattern: DBM slow query — artificial delay via MySQL SLEEP
# Adapt: replace 'your_table' with a domain entity table

def self.find_all_slow_mysql
  sql = "SELECT *, SLEEP(0.3) FROM your_table ORDER BY created_at DESC LIMIT 50"
  ActiveRecord::Base.connection.execute(sql).to_a
end
