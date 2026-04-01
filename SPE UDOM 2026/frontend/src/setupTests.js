// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

jest.mock(
  'react-router-dom',
  () => ({
    BrowserRouter: ({ children }) => <>{children}</>,
    Routes: ({ children }) => <>{children}</>,
    Route: ({ element }) => element,
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    Navigate: () => null,
    useLocation: () => ({ pathname: '/' }),
    useNavigate: () => jest.fn(),
    useParams: () => ({ uidb64: 'test-uid', token: 'test-token' }),
  }),
  { virtual: true }
);

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        members: [],
        room_key: 'spe-support',
        room_name: 'SPE Support',
        display_name: 'Guest User',
        sender_role: 'guest',
        messages: [],
      }),
  })
);

class MockWebSocket {
  static OPEN = 1;

  constructor() {
    this.readyState = MockWebSocket.OPEN;
    setTimeout(() => {
      if (this.onopen) {
        this.onopen();
      }
    }, 0);
  }

  send() {}

  close() {
    if (this.onclose) {
      this.onclose();
    }
  }
}

global.WebSocket = MockWebSocket;
