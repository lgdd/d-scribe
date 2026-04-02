# Pattern: DBM N+1 — one query per parent row
# Adapt: replace table/column names with domain entities
DB_URL = ENV.fetch("DATABASE_URL", "postgresql://demo:demo@postgresql:5432/demo")

def self.items_with_details
  conn = ActiveRecord::Base.connection
  parents = conn.execute("SELECT * FROM parents").to_a
  parents.map do |parent|
    children = conn.execute(
      "SELECT * FROM children WHERE parent_id = #{parent['id']}"
    ).to_a
    { parent: parent, children: children }
  end
end
