import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import { ChevronDown, ChevronUp, Copy, Circle, Star } from 'lucide-react';

const DescriptionCompo = ({ data, isSolved }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [openTestCases, setOpenTestCases] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedType, setCopiedType] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (!data) return <div className="text-gray-600 dark:text-gray-300 text-xl">Loading...</div>;

  const { Title, Description, DifficultyLevel, TopicTag, VisibleTestCases, points } = data;

  const toggleTestCase = (index) => {
    setOpenTestCases((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const copyContent = (content, index, type) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedIndex(null);
      setCopiedType(null);
    }, 2000);
  };

  const difficultyStyles = {
    Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className={`p-4 max-w-3xl pl-2 ${isDarkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-3xl mb-10"
      >
        {Title}
      </motion.h1>
      <div className="flex justify-items-start align-baseline gap-2 mb-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl mb-5 flex items-center gap-2"
        >
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-base font-medium ${
              difficultyStyles[DifficultyLevel] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}
            data-tooltip-id="difficulty-tooltip"
            data-tooltip-content={`Difficulty: ${DifficultyLevel}`}
          >
            <Circle size={16} className="mr-1" />
            {DifficultyLevel}
          </span>
        </motion.div>
        {points !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl mb-5 flex items-center gap-2"
          >
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-base font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
              data-tooltip-id="points-tooltip"
              data-tooltip-content={`${points}`}
            >
              <Star size={16} className="mr-1" />
              {points}
            </span>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl mb-5"
        >
          <div className="flex flex-wrap gap-2">
            {TopicTag ? (
              TopicTag.split(',').map((tag, index) => (
                <motion.span
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-base"
                  data-tooltip-id={`tag-${index}-tooltip`}
                  data-tooltip-content={tag.trim()}
                >
                  {tag.trim()}
                </motion.span>
              ))
            ) : (
              <span className="text-gray-600 dark:text-gray-300 text-base">No topics</span>
            )}
            {isSolved && (
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 rounded-full text-base"
                data-tooltip-id="solved-tooltip"
                data-tooltip-content="Problem Solved"
              >
                Solved
              </motion.span>
            )}
          </div>
        </motion.div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-xl mb-5"
      >
        {Description}
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl mt-10 mb-3 font-bold">Sample Test Cases</h3>
        {VisibleTestCases.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300 text-xl">No test cases</p>
        ) : (
          <div className="space-y-2">
            {VisibleTestCases.map((testCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-md ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
              >
                <button
                  onClick={() => toggleTestCase(index)}
                  className="flex items-center justify-between w-full text-xl font-medium"
                  data-tooltip-id={`test-case-${index}-tooltip`}
                  data-tooltip-content={`Toggle test case ${index + 1}`}
                >
                  Test Case {index + 1}
                  {openTestCases.includes(index) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <AnimatePresence>
                  {openTestCases.includes(index) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 text-base"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <pre className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          <strong>Input:</strong> {testCase.Input}
                        </pre>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => copyContent(testCase.Input, index, 'input')}
                          className={`p-1 rounded-md ${
                            isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          data-tooltip-id={`copy-input-${index}-tooltip`}
                          data-tooltip-content={copiedIndex === index && copiedType === 'input' ? 'Copied!' : 'Copy input'}
                        >
                          <Copy size={16} />
                        </motion.button>
                      </div>
                      <div className="flex justify-between items-start mb-1">
                        <pre className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          <strong>Output:</strong> {testCase.Output}
                        </pre>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => copyContent(testCase.Output, index, 'output')}
                          className={`p-1 rounded-md ${
                            isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          data-tooltip-id={`copy-output-${index}-tooltip`}
                          data-tooltip-content={copiedIndex === index && copiedType === 'output' ? 'Copied!' : 'Copy output'}
                        >
                          <Copy size={16} />
                        </motion.button>
                      </div>
                      {testCase.Explanation && (
                        <pre className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          <strong>Explanation:</strong> {testCase.Explanation}
                        </pre>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tooltips */}
      <Tooltip id="difficulty-tooltip" place="top" />
      <Tooltip id="points-tooltip" place="top" />
      {TopicTag &&
        TopicTag.split(',').map((_, index) => (
          <Tooltip key={index} id={`tag-${index}-tooltip`} place="top" />
        ))}
      {isSolved && <Tooltip id="solved-tooltip" place="top" />}
      {VisibleTestCases.map((_, index) => (
        <>
          <Tooltip key={`test-case-${index}`} id={`test-case-${index}-tooltip`} place="top" />
          <Tooltip key={`copy-input-${index}`} id={`copy-input-${index}-tooltip`} place="top" />
          <Tooltip key={`copy-output-${index}`} id={`copy-output-${index}-tooltip`} place="top" />
        </>
      ))}
    </div>
  );
};

export default DescriptionCompo;