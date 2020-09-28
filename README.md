# flaky-tracker

Project that scans and extract flaky tests from Buildkite pipelines

## Installation

1. Create an S3 bucket
1. Upload the Buildkite token to s3 Bucket:
    1. The S3 object key name should be of the form `<Organization Name>/config.json`
    1. The content should be

        ```json
        {
          "buildkite_api_key": "<Buildkite API Key>"
        }
        ```

1. Install library: `yarn add flaky-tracker`

## Usage

1. Call the `extractFlakySpec`. For Example:

    ```typescript
      import extractFlakySpec, {
        aggregateArtifactStrategy,
        flakyJobsOutputStrategy,
      } from "flaky-tracker";

      await extractFlakySpec(
        "<S3 bucket Name>",
        "<Organization Name>",
        "<Pipeline Name>",
        "<Pipeline Slug>",
        flakyJobsOutputStrategy,
      );
    ```

1. The above function will scan the builds from the last 2 days and upload the flaky specs to the S3 Bucket. You can use Quicksight to create graphs/tables using the S3 Bucket.

## Supported strategies

1. `flakyJobsOutputStrategy`

    This strategy scans the rspec output of jobs that passed on retry. It works if you use the default rspec output, and do not retry inside the same job

1. `aggregateArtifactStrategy`

    This strategy works if you aggregate all failures in an artifacts `tmp/non-deterministic-and-failures.json`, even when the build passes
