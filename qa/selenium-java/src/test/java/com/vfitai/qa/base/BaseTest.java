package com.vfitai.qa.base;

import com.vfitai.qa.utils.*;
import org.openqa.selenium.*;
import org.testng.*;
import org.testng.annotations.*;
import java.nio.file.*;
import java.lang.reflect.Method;

public abstract class BaseTest {
    protected WebDriver driver;
    protected QaEnvironment environment;
    @BeforeMethod(alwaysRun = true)
    public void setup(Method method) throws Exception {
        environment = new QaEnvironment(); environment.control("reset");
        driver = DriverFactory.create();
        Reporter.log("Browser: " + ((org.openqa.selenium.remote.RemoteWebDriver)driver).getCapabilities().getBrowserVersion(), true);
        driver.get(environment.ui());
        ((JavascriptExecutor)driver).executeScript("localStorage.setItem('language','vi')");
    }
    @AfterMethod(alwaysRun = true)
    public void teardown(ITestResult result) throws Exception {
        try {
            if (driver != null && !result.isSuccess()) {
                try {
                    Path output = Path.of("target", "screenshots", result.getMethod().getMethodName() + "-" + System.nanoTime() + ".png");
                    Files.createDirectories(output.getParent());
                    Files.write(output, ((TakesScreenshot)driver).getScreenshotAs(OutputType.BYTES));
                    Reporter.log("Failure screenshot: " + output, true);
                    // Do not dump localStorage, cookies, credentials or full page source.
                    Reporter.log("Failure URL: " + driver.getCurrentUrl(), true);
                } catch (Exception captureError) { Reporter.log("Screenshot unavailable: " + captureError.getClass().getSimpleName(), true); }
            }
        } finally {
            try { if (driver != null) driver.quit(); }
            finally { driver = null; if (environment != null) environment.control("clear"); }
        }
    }
}
