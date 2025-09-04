const msw = require('msw');

// Define handlers for mocking API requests during tests
const handlers = [
  // Mock polls API
  msw.rest.get('*/api/polls', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        polls: [
          { id: '1', title: 'Mock Poll 1', description: 'Description 1' },
          { id: '2', title: 'Mock Poll 2', description: 'Description 2' },
        ],
      })
    );
  }),

  msw.rest.get('*/api/polls/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        poll: {
          id,
          title: `Mock Poll ${id}`,
          description: `Description for poll ${id}`,
          options: [
            { id: 'opt1', text: 'Option 1' },
            { id: 'opt2', text: 'Option 2' },
          ],
        },
      })
    );
  }),

  msw.rest.post('*/api/polls', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'Poll created successfully',
        poll: {
          id: 'new-poll-id',
          title: 'New Poll',
          description: 'New Poll Description',
        },
      })
    );
  }),

  msw.rest.put('*/api/polls/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Poll updated successfully',
        poll: {
          id,
          title: 'Updated Poll',
          description: 'Updated Description',
        },
      })
    );
  }),

  msw.rest.delete('*/api/polls/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Poll deleted successfully',
      })
    );
  }),

  msw.rest.post('*/api/polls/:id/vote', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Vote recorded successfully',
        vote: {
          id: 'new-vote-id',
          poll_id: id,
          option_id: 'opt1',
        },
      })
    );
  }),

  // Mock auth API
  msw.rest.get('*/api/auth/session', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
    );
  }),

  msw.rest.post('*/api/auth/signin', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        url: '/dashboard',
      })
    );
  }),

  msw.rest.post('*/api/auth/signout', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        url: '/',
      })
    );
  }),
];

module.exports = { handlers };