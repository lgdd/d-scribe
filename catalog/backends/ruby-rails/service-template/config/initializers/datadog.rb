Datadog.configure do |c|
  c.tracing.instrument :rails
  c.tracing.instrument :pg
end
