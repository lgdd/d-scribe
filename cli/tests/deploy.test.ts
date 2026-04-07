import { describe, it, expect } from 'vitest';
import { parseDeploy } from '../src/core/deploy.js';

describe('parseDeploy', () => {
  it('defaults "compose" to compose:local', () => {
    expect(parseDeploy('compose')).toEqual({ stack: 'compose', provider: 'local', service: null });
  });

  it('parses explicit "compose:local"', () => {
    expect(parseDeploy('compose:local')).toEqual({ stack: 'compose', provider: 'local', service: null });
  });

  it('defaults "k8s" to k8s:local:minikube', () => {
    expect(parseDeploy('k8s')).toEqual({ stack: 'k8s', provider: 'local', service: 'minikube' });
  });

  it('defaults "k8s:local" to k8s:local:minikube', () => {
    expect(parseDeploy('k8s:local')).toEqual({ stack: 'k8s', provider: 'local', service: 'minikube' });
  });

  it('parses explicit "k8s:local:minikube"', () => {
    expect(parseDeploy('k8s:local:minikube')).toEqual({ stack: 'k8s', provider: 'local', service: 'minikube' });
  });

  it('defaults "k8s:aws" to k8s:aws:ec2', () => {
    expect(parseDeploy('k8s:aws')).toEqual({ stack: 'k8s', provider: 'aws', service: 'ec2' });
  });

  it('parses explicit "k8s:aws:ec2"', () => {
    expect(parseDeploy('k8s:aws:ec2')).toEqual({ stack: 'k8s', provider: 'aws', service: 'ec2' });
  });

  it('defaults "compose:aws" to compose:aws:ec2', () => {
    expect(parseDeploy('compose:aws')).toEqual({ stack: 'compose', provider: 'aws', service: 'ec2' });
  });

  it('parses explicit "compose:aws:ec2"', () => {
    expect(parseDeploy('compose:aws:ec2')).toEqual({ stack: 'compose', provider: 'aws', service: 'ec2' });
  });

  it('throws on unknown stack', () => {
    expect(() => parseDeploy('docker')).toThrow(/unknown stack.*docker/i);
  });

  it('throws on unknown provider', () => {
    expect(() => parseDeploy('k8s:gcp')).toThrow(/unknown provider.*gcp/i);
  });

  it('throws on invalid combination compose:aws:eks', () => {
    expect(() => parseDeploy('compose:aws:eks')).toThrow(/invalid.*compose.*eks/i);
  });

  it('throws on invalid combination compose:local:minikube', () => {
    expect(() => parseDeploy('compose:local:minikube')).toThrow(/invalid.*compose.*minikube/i);
  });

  it('rejects k8s:aws:eks as not yet supported', () => {
    expect(() => parseDeploy('k8s:aws:eks')).toThrow(/not yet supported/i);
  });
});
