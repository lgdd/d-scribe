FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /out

FROM datadog/dd-lib-dotnet-init AS dd-tracer

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=dd-tracer /datadog-init/monitoring-home /opt/datadog
COPY --from=build /out .
ENV DD_LOGS_INJECTION=true
ENV CORECLR_ENABLE_PROFILING=1
ENV CORECLR_PROFILER={846F5F1C-F9AE-4B07-969E-05C26BC060D8}
ENV CORECLR_PROFILER_PATH=/opt/datadog/Datadog.Trace.ClrProfiler.Native.so
ENV DD_DOTNET_TRACER_HOME=/opt/datadog
ENTRYPOINT ["dotnet", "service.dll"]
