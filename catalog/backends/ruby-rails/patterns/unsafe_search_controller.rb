# Pattern: Code Security — SQL injection via string interpolation
# WARNING: intentionally vulnerable for IAST demo
# Adapt: replace table/column with domain entity

def search
  q = params[:q].to_s
  sql = "SELECT * FROM items WHERE name LIKE '%#{q}%'" # rubocop:disable Rails/SquishedSQLHeredocs
  results = ActiveRecord::Base.connection.execute(sql).to_a
  render json: results
end
