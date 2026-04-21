#!/usr/bin/env python3
"""
Post-run script to verify service startup
"""
import sys
import time
import socket
import argparse

def check_port(host, port, timeout=2):
    """Check if a port is open"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def main():
    parser = argparse.ArgumentParser(description='Check service startup')
    parser.add_argument('--port', type=int, default=5000, help='Port to check')
    parser.add_argument('--host', type=str, default='127.0.0.1', help='Host to check')
    parser.add_argument('--timeout', type=int, default=60, help='Max wait time in seconds')

    args = parser.parse_args()

    print(f"Checking service at {args.host}:{args.port}...")
    print(f"Max wait time: {args.timeout} seconds")

    start_time = time.time()
    check_count = 0
    while time.time() - start_time < args.timeout:
        check_count += 1
        if check_port(args.host, args.port, timeout=2):
            elapsed = time.time() - start_time
            print(f"✓ Service is ready at {args.host}:{args.port} (took {elapsed:.2f}s, {check_count} checks)")
            sys.exit(0)
        print(f"Check {check_count} failed, retrying...")
        time.sleep(2)

    elapsed = time.time() - start_time
    print(f"✗ Service check failed: {args.host}:{args.port} not available after {elapsed:.2f}s ({check_count} checks)")
    sys.exit(1)

if __name__ == '__main__':
    main()
