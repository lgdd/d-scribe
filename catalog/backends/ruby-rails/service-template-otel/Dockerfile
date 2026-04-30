FROM ruby:3.3-slim
RUN apt-get update && apt-get install -y build-essential libpq-dev libyaml-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Gemfile Gemfile.lock* ./
RUN bundle install
COPY . .
ENV RAILS_LOG_TO_STDOUT=true
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "8080"]
