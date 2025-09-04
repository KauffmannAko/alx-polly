const { TextEncoder, TextDecoder } = require('util');
const { TransformStream } = require('stream/web');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.TransformStream = TransformStream;
global.BroadcastChannel = jest.fn(() => ({
  postMessage: jest.fn(),
  close: jest.fn(),
  onmessage: jest.fn(),
  onmessageerror: jest.fn(),
}));

require('whatwg-fetch');
require('@testing-library/jest-dom');

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}));

// Import MSW server setup
const { server } = require('./__tests__/mocks/server');

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());