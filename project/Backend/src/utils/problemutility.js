// In Backend/src/utils/problemutility.js
const axios = require('axios');
require("dotenv/config");

// Map language to Judge0 language ID
const getlanguageId = (language) => {
  if (!language || typeof language !== 'string') {
    const errorObj = {
      error: 'Invalid language',
      details: `Language must be a string, received: ${typeof language}`,
      statusCode: null,
    };
    console.error('getlanguageId Error:', JSON.stringify(errorObj, null, 2));
    throw errorObj; // Throw object directly
  }
  language = language.toLowerCase();
  const language_Id = {
    cpp: 54,
    c: 50,
    java: 62,
    python: 71,
    javascript: 63,
  };
  if (!language_Id[language]) {
    const errorObj = { error: 'Invalid language', details: `Unsupported language: ${language}`, statusCode: null };
    console.error('getlanguageId Error:', JSON.stringify(errorObj, null, 2));
    throw errorObj;
  }
  return language_Id[language];
};

// Reverse mapping from Judge0 language ID to language name
const getLanguageName = (languageId) => {
  const languageIdMap = {
    54: 'cpp',
    50: 'c',
    62: 'java',
    71: 'python',
    63: 'javascript',
  };
  return languageIdMap[languageId] || 'unknown';
};

// Utility to wait for a specified time
const wait = (timer) => new Promise((resolve) => setTimeout(() => resolve(1), timer));

// Submit multiple code submissions to Judge0
const SubmitBatch = async (submissions, retries = 3, delay = 5000) => {
  if (!process.env.JUDGE0_API_KEY) {
    const errorObj = { error: 'Configuration error', details: 'JUDGE0_API_KEY environment variable is not set', statusCode: null };
    console.error('SubmitBatch Error:', JSON.stringify(errorObj, null, 2));
    throw errorObj;
  }

  if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
    const errorObj = { error: 'Invalid input', details: 'Invalid or empty submissions array', statusCode: null };
    console.error('SubmitBatch Error:', JSON.stringify(errorObj, null, 2));
    throw errorObj;
  }

  const encodedSubmissions = submissions.map((submission, index) => {
    if (!submission.source_code || !submission.language_id || submission.stdin === undefined || submission.expected_output === undefined) {
      const errorObj = { error: 'Invalid submission', details: `Missing required submission fields at index ${index}`, statusCode: null };
      console.error('SubmitBatch Error:', JSON.stringify(errorObj, null, 2));
      throw errorObj;
    }
    return {
      source_code: Buffer.from(submission.source_code).toString('base64'),
      language_id: submission.language_id,
      stdin: Buffer.from(submission.stdin || '').toString('base64'),
      expected_output: Buffer.from(submission.expected_output || '').toString('base64'),
    };
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        'https://judge0-ce.p.rapidapi.com/submissions/batch?base64_encoded=true',
        { submissions: encodedSubmissions },
        {
          headers: {
            'x-rapidapi-key': process.env.JUDGE0_API_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Judge0 submission response:', response.data);
      return response.data;
    } catch (error) {
      const errorObj = {
        error: 'Submission failed',
        details: error.response?.data?.message || error.message,
        statusCode: error.response?.status || null,
      };
      if (error.response?.status === 429 && attempt < retries) {
        console.warn(`Rate limit exceeded. Retrying after ${delay}ms... (Attempt ${attempt}/${retries})`);
        await wait(delay);
        continue;
      }
      console.error('SubmitBatch Error:', JSON.stringify(errorObj, null, 2));
      throw errorObj;
    }
  }
  const errorObj = { error: 'Submission failed', details: 'Max retries reached due to rate limiting', statusCode: 429 };
  console.error('SubmitBatch Error:', JSON.stringify(errorObj, null, 2));
  throw errorObj;
};

// Poll Judge0 for submission results
const SubmitTokens = async (ResultTokens, maxAttempts = 30, retryDelay = 5000) => {
  if (!process.env.JUDGE0_API_KEY) {
    const errorObj = { error: 'Configuration error', details: 'JUDGE0_API_KEY environment variable is not set', statusCode: null };
    console.error('SubmitTokens Error:', JSON.stringify(errorObj, null, 2));
    throw errorObj;
  }

  const submitTokens = ResultTokens.map((value) => value.token);
  if (!submitTokens.length) {
    const errorObj = { error: 'Invalid input', details: 'No tokens provided', statusCode: null };
    console.error('SubmitTokens Error:', JSON.stringify(errorObj, null, 2));
    throw errorObj;
  }

  const options = {
    method: 'GET',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
      tokens: submitTokens.join(','),
      base64_encoded: 'true',
      fields: 'status_id,stdout,stderr,compile_output,time,memory,token,language_id',
    },
    headers: {
      'x-rapidapi-key': process.env.JUDGE0_API_KEY,
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    },
  };

  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await axios.request(options);
      const submissions = response.data.submissions;

      submissions.forEach((submission, index) => {
        if (submission.stdout) submission.stdout = Buffer.from(submission.stdout, 'base64').toString();
        if (submission.stderr) submission.stderr = Buffer.from(submission.stderr, 'base64').toString();
        if (submission.compile_output) submission.compile_output = Buffer.from(submission.compile_output, 'base64').toString();
      });

      if (submissions.every((value) => value.status_id > 2)) {
        // Check for compilation errors (status_id == 6)
        const compilationErrors = submissions.filter((sub) => sub.status_id === 6);
        if (compilationErrors.length > 0) {
          const languageName = getLanguageName(compilationErrors[0].language_id);
          console.log('Compilation error for language_id:', compilationErrors[0].language_id, 'mapped to:', languageName);
          const errorObj = {
            error: `Validation failed for ${languageName} on test case`,
            details: 'Compilation Error',
            stderr: compilationErrors[0].stderr || 'No error output',
            compile_output: compilationErrors[0].compile_output || 'No compile output',
            statusCode: null,
          };
          console.error('SubmitTokens Error:', JSON.stringify(errorObj, null, 2));
          throw errorObj; // Throw object directly
        }
        return submissions;
      }

      await wait(1000);
      attempts++;
    } catch (error) {
      const errorObj = {
        error: 'Polling failed',
        details: error.message || 'Unknown error during polling',
        statusCode: error.response?.status || null,
        stderr: error.stderr || undefined,
        compile_output: error.compile_output || undefined,
      };
      if (error.response?.status === 429 && attempts < maxAttempts) {
        console.warn(`Rate limit exceeded. Retrying after ${retryDelay}ms... (Attempt ${attempts}/${maxAttempts})`);
        await wait(retryDelay);
        attempts++;
        continue;
      }
      console.error('SubmitTokens Error:', JSON.stringify(errorObj, null, 2));
      throw errorObj; // Throw object directly
    }
  }

  const errorObj = { error: 'Polling failed', details: 'Polling timeout: Maximum attempts reached', statusCode: null };
  console.error('SubmitTokens Error:', JSON.stringify(errorObj, null, 2));
  throw errorObj;
};

module.exports = { getlanguageId, SubmitBatch, SubmitTokens };