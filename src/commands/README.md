# Commands

All commands should follow the same structure:
- async **run()** is the primary execution function. This function shoudl always include a try/catch handler to report errors. 
- **validateFlags()** should run first and preform input validation on input flags.
