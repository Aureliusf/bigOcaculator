const readline = require('readline');
const fs = require('fs');
const path = require('path');

/**
 * Prompts the user for a file path with tab completion.
 * @param {string} promptText - The text to display to the user.
 * @returns {Promise<string>} - The absolute path to the selected file.
 */
function getFileWithAutocomplete(promptText) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: (line) => {
        const currentDir = path.resolve(process.cwd());
        let searchDir = currentDir;
        let partial = line;

        // Determine directory to search and partial filename
        if (line) {
          const absoluteLine = path.isAbsolute(line) ? line : path.resolve(currentDir, line);
          searchDir = line.endsWith(path.sep) ? absoluteLine : path.dirname(absoluteLine);
          partial = line.endsWith(path.sep) ? '' : path.basename(absoluteLine);
        }

        try {
          const files = fs.readdirSync(searchDir);
          const hits = files.filter((f) => f.startsWith(partial));
          
          // Map hits back to the input format (relative or absolute)
          const completions = hits.map(hit => {
            if (path.isAbsolute(line)) {
              return path.join(searchDir, hit);
            } else {
               // Reconstruct relative path
               const relativeDir = path.relative(currentDir, searchDir);
               if (relativeDir === '') return hit;
               return path.join(relativeDir, hit);
            }
          });
          
          // Append separator to directories for better UX
          const typeMarkedCompletions = completions.map(c => {
             const fullPath = path.resolve(currentDir, c);
             try {
                if (fs.statSync(fullPath).isDirectory()) {
                    return c + path.sep;
                }
             } catch (e) {}
             return c;
          });

          return [typeMarkedCompletions, line];
        } catch (err) {
          return [[], line];
        }
      }
    });

    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

module.exports = {
  getFileWithAutocomplete
};
