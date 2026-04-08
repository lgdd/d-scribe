# Pattern: Code Security — SSRF via unvalidated URL parameter
# WARNING: intentionally vulnerable for IAST demo
# Adapt: use a domain-appropriate endpoint name

def fetch_url
  url = params[:url].to_s
  response = Net::HTTP.get(URI(url))
  render json: { body: response }
rescue StandardError => e
  render json: { error: e.message }, status: :internal_server_error
end
