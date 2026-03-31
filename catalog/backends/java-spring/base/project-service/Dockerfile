FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre
WORKDIR /app
ADD https://dtdg.co/latest-java-tracer /app/dd-java-agent.jar
COPY --from=build /app/target/*.jar app.jar
ENV DD_LOGS_INJECTION=true
ENTRYPOINT ["java", "-javaagent:/app/dd-java-agent.jar", "-jar", "app.jar"]
