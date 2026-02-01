export type TestCase = {
  name: string;
  run: () => void | Promise<void>;
};

const colours = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        gray: "\x1b[90m",
        crimson: "\x1b[38m"
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        gray: "\x1b[100m",
        crimson: "\x1b[48m"
    }
};

// Helper: normalize query string segment order
const Normalize = (qs: string) : string => {
   const withoutPrefix = qs.startsWith('?') ? qs.slice(1) : qs;
   const sorted = withoutPrefix.split('&').filter(Boolean).sort().join('&');
   return qs.startsWith('?') ? `?${sorted}` : sorted;
};

class TestHarness {
  private passed = 0;
  private failed = 0;
  private tests: TestCase[] = [];

  add(name: string, fn: () => void | Promise<void>) {
    const testCount: number = this.tests.length + 1;
    this.tests.push({ name: `Test ${testCount}: ${name}`, run: fn });
  }

  async run() {
    for (let i = 0; i < this.tests.length; i++) {
      const test = this.tests[i];
      try {
        await test.run();
        this.passed++;
        console.log(`✅ PASS - ${test.name}`);
      } catch (err) {
        this.failed++;
        console.error(`❌ FAIL - ${test.name}`);
        console.error(err instanceof Error ? err.message : err);
      }
    }

    console.log('\nTests completed:\n');

    if(this.passed > 0) {
      console.log(colours.fg.green + `${this.passed} passed` + colours.reset);
    }

    if (this.failed > 0) {
      console.log(colours.fg.red + `${this.failed} failed` + colours.reset);
    }
    
    console.log('\n');
  }

  static assertEqual(actual: unknown, expected: unknown) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    if (!pass) {
      throw new Error(
        `Assertion failed.\n\nExpected output:\n${JSON.stringify(
          expected,
          null,
          2
        )}\n\nActual output:\n${JSON.stringify(actual, null, 2)}\n`
      );
    }
  }

  static assertNotEqual(actual: unknown, expected: unknown) {
    const pass = JSON.stringify(actual) !== JSON.stringify(expected);
    if (!pass) {
      throw new Error(
        `Assertion failed.\n\nDid not expect: ${JSON.stringify(expected, null, 2)}\n`
      );
    }
  }

  static assertTrue(value: unknown) {
    if (value !== true) {
      throw new Error(`Assertion failed.\n\nExpected true but got: ${value}\n`);
    }
  }

  static assertFalse(value: unknown) {
    if (value !== false) {
      throw new Error(`Assertion failed.\n\nExpected false but got: ${value}\n`);
    }
  }

  static assertThrows(fn: () => void, expectedMessage?: string | RegExp) {
    let threw = false;
    try {
      fn();
    } catch (err) {
      threw = true;
      if (expectedMessage) {
        const message = err instanceof Error ? err.message : String(err);
        if (
          (typeof expectedMessage === 'string' &&
            !message.includes(expectedMessage)) ||
          (expectedMessage instanceof RegExp &&
            !expectedMessage.test(message))
        ) {
          throw new Error(
            `Assertion failed.\n\nExpected error message to match: ${expectedMessage}\n\nActual: ${message}\n`
          );
        }
      }
    }
    if (!threw) {
      throw new Error('Assertion failed.\n\nExpected function to throw.\n');
    }
  }
}

export { TestHarness, Normalize };