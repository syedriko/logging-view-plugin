import { TestIds } from '../../src/test-ids';
import {
  queryRangeMatrixInvalidResponse,
  queryRangeMatrixValidResponse,
  queryRangeStreamsInvalidResponse,
  queryRangeStreamsvalidResponse,
} from '../fixtures/query-range-fixtures';

const LOGS_PAGE_URL = '/monitoring/logs';
const QUERY_RANGE_STREAMS_URL_MATCH =
  '/api/proxy/plugin/logging-view-plugin/backend/api/logs/v1/application/loki/api/v1/query_range?query=%7B*';
const QUERY_RANGE_MATRIX_URL_MATCH =
  '/api/proxy/plugin/logging-view-plugin/backend/api/logs/v1/application/loki/api/v1/query_range?query=sum*';
const QUERY_RANGE_STREAMS_INFRASTRUCTURE_URL_MATCH =
  '/api/proxy/plugin/logging-view-plugin/backend/api/logs/v1/infrastructure/loki/api/v1/query_range?query=%7B*';
const QUERY_RANGE_MATRIX_INFRASTRUCTURE_URL_MATCH =
  '/api/proxy/plugin/logging-view-plugin/backend/api/logs/v1/infrastructure/loki/api/v1/query_range?query=sum*';
const TEST_MESSAGE = "loki_1 | level=info msg='test log'";

describe('Logs Page', () => {
  it('renders correctly with an expected response', () => {
    cy.intercept(
      QUERY_RANGE_STREAMS_URL_MATCH,
      queryRangeStreamsvalidResponse({ message: TEST_MESSAGE }),
    );
    cy.intercept(QUERY_RANGE_MATRIX_URL_MATCH, queryRangeMatrixValidResponse());

    cy.visit(LOGS_PAGE_URL);

    cy.getByTestId(TestIds.RefreshIntervalDropdown).should('exist');
    cy.getByTestId(TestIds.TimeRangeDropdown).should('exist');
    cy.getByTestId(TestIds.SyncButton).should('exist');
    cy.getByTestId(TestIds.LogsQueryInput).should('exist');

    cy.getByTestId(TestIds.LogsTable)
      .should('exist')
      .within(() => {
        cy.contains(TEST_MESSAGE);
      });

    cy.getByTestId(TestIds.LogsHistogram)
      .should('exist')
      .within(() => {
        cy.get('svg g > path').should('have.length.above', 0);
      });
  });

  it('handles errors gracefully when a request fails', () => {
    cy.intercept(QUERY_RANGE_STREAMS_URL_MATCH, (req) => {
      req.continue((res) =>
        res.send({ statusCode: 500, body: 'Internal Server Error' }),
      );
    });
    cy.intercept(QUERY_RANGE_MATRIX_URL_MATCH, (req) => {
      req.continue((res) =>
        res.send({ statusCode: 500, body: 'Internal Server Error' }),
      );
    });

    cy.visit(LOGS_PAGE_URL);

    cy.getByTestId(TestIds.LogsTable)
      .should('exist')
      .within(() => {
        cy.contains('Internal Server Error');
      });

    cy.getByTestId(TestIds.LogsHistogram)
      .should('exist')
      .within(() => {
        cy.contains('Internal Server Error');
      });
  });

  it('handles errors gracefully when a response is invalid', () => {
    cy.intercept(
      QUERY_RANGE_STREAMS_URL_MATCH,
      queryRangeStreamsInvalidResponse(),
    );
    cy.intercept(
      QUERY_RANGE_MATRIX_URL_MATCH,
      queryRangeMatrixInvalidResponse(),
    );

    cy.visit(LOGS_PAGE_URL);

    cy.getByTestId(TestIds.LogsTable)
      .should('exist')
      .within(() => {
        cy.contains('Unexpected end of JSON input');
      });

    cy.getByTestId(TestIds.LogsHistogram)
      .should('exist')
      .within(() => {
        cy.contains('Unexpected end of JSON input');
      });
  });

  it('executes a query when "run query" is pressed', () => {
    cy.intercept(
      QUERY_RANGE_STREAMS_URL_MATCH,
      queryRangeStreamsvalidResponse({ message: TEST_MESSAGE }),
    ).as('queryRangeStreams');
    cy.intercept(
      QUERY_RANGE_MATRIX_URL_MATCH,
      queryRangeMatrixValidResponse(),
    ).as('queryRangeMatrix');

    cy.visit(LOGS_PAGE_URL);

    cy.getByTestId(TestIds.LogsTable)
      .should('exist')
      .within(() => {
        cy.contains(TEST_MESSAGE);
      });

    cy.getByTestId(TestIds.LogsHistogram)
      .should('exist')
      .within(() => {
        cy.get('svg g > path').should('have.length.above', 0);
      });

    cy.getByTestId(TestIds.ExecuteQueryButton).click();

    cy.get('@queryRangeStreams.all').should('have.length.at.least', 1);
    cy.get('@queryRangeMatrix.all').should('have.length.at.least', 1);
  });

  it('executes a query with a new value when "Enter" is pressed on the query input field', () => {
    cy.intercept(
      QUERY_RANGE_STREAMS_URL_MATCH,
      queryRangeStreamsvalidResponse({ message: TEST_MESSAGE }),
    ).as('queryRangeStreams');
    cy.intercept(
      QUERY_RANGE_MATRIX_URL_MATCH,
      queryRangeMatrixValidResponse(),
    ).as('queryRangeMatrix');

    cy.visit(LOGS_PAGE_URL);

    cy.getByTestId(TestIds.LogsTable)
      .should('exist')
      .within(() => {
        cy.contains(TEST_MESSAGE);
      });

    cy.getByTestId(TestIds.LogsHistogram)
      .should('exist')
      .within(() => {
        cy.get('svg g > path').should('have.length.above', 0);
      });

    cy.getByTestId(TestIds.LogsQueryInput).within(() => {
      cy.get('input')
        .type('{selectAll}')
        .type('{ job = "some_job" }', {
          parseSpecialCharSequences: false,
          delay: 1,
        })
        .type('{enter}');
    });

    cy.get('@queryRangeStreams.all').should('have.length.at.least', 1);
    cy.get('@queryRangeMatrix.all').should('have.length.at.least', 1);
  });

  it('executes a query with the selected tenant when "run query" is pressed', () => {
    cy.intercept(
      QUERY_RANGE_STREAMS_URL_MATCH,
      queryRangeStreamsvalidResponse({ message: TEST_MESSAGE }),
    ).as('queryRangeStreams');
    cy.intercept(
      QUERY_RANGE_MATRIX_URL_MATCH,
      queryRangeMatrixValidResponse(),
    ).as('queryRangeMatrix');

    cy.intercept(
      QUERY_RANGE_STREAMS_INFRASTRUCTURE_URL_MATCH,
      queryRangeStreamsvalidResponse({ message: TEST_MESSAGE }),
    ).as('queryRangeStreamsInfrastructure');
    cy.intercept(
      QUERY_RANGE_MATRIX_INFRASTRUCTURE_URL_MATCH,
      queryRangeMatrixValidResponse(),
    ).as('queryRangeMatrixInfrastructure');

    cy.visit(LOGS_PAGE_URL);

    cy.getByTestId(TestIds.LogsTable)
      .should('exist')
      .within(() => {
        cy.contains(TEST_MESSAGE);
      });

    cy.getByTestId(TestIds.LogsHistogram)
      .should('exist')
      .within(() => {
        cy.get('svg g > path').should('have.length.above', 0);
      });

    cy.getByTestId(TestIds.TenantDropdown).click();
    cy.contains('infrastructure').click();

    cy.getByTestId(TestIds.ExecuteQueryButton).click();

    cy.get('@queryRangeStreams.all').should('have.length.at.least', 1);
    cy.get('@queryRangeMatrix.all').should('have.length.at.least', 1);
    cy.get('@queryRangeStreamsInfrastructure.all').should(
      'have.length.at.least',
      1,
    );
    cy.get('@queryRangeMatrixInfrastructure.all').should(
      'have.length.at.least',
      1,
    );
  });

  it('stores selected values for time range and refresh interval', () => {
    cy.intercept(
      QUERY_RANGE_STREAMS_URL_MATCH,
      queryRangeStreamsvalidResponse({ message: TEST_MESSAGE }),
    ).as('queryRangeStreams');
    cy.intercept(
      QUERY_RANGE_MATRIX_URL_MATCH,
      queryRangeMatrixValidResponse(),
    ).as('queryRangeMatrix');

    cy.visit(LOGS_PAGE_URL);

    cy.getByTestId(TestIds.RefreshIntervalDropdown)
      .click()
      .within(() => {
        cy.contains('1 minute').click();
      });

    cy.getByTestId(TestIds.TimeRangeDropdown)
      .click()
      .within(() => {
        cy.contains('Last 6 hours').click();
      });

    cy.reload();

    cy.getByTestId(TestIds.RefreshIntervalDropdown).within(() => {
      cy.contains('1 minute');
    });

    cy.getByTestId(TestIds.TimeRangeDropdown).within(() => {
      cy.contains('Last 6 hours');
    });
  });
});