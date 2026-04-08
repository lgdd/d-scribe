require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_view/railtie"
require "rails/test_unit/railtie"

module Service
  class Application < Rails::Application
    config.load_defaults 8.0
    config.api_only = true
    config.log_level = :info
  end
end
