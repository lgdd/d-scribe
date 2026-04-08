# Pattern: SIEM — structured audit log for auth-relevant events
# Adapt: log fields relevant to your domain's security events
require "json"

class AuditLogMiddleware
  def initialize(app)
    @app = app
    @logger = Logger.new($stdout)
  end

  def call(env)
    status, headers, response = @app.call(env)
    @logger.info({
      method: env["REQUEST_METHOD"],
      path: env["PATH_INFO"],
      status: status,
      remote: env["REMOTE_ADDR"]
    }.to_json)
    [status, headers, response]
  end
end
