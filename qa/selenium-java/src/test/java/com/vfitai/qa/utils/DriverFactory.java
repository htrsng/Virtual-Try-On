package com.vfitai.qa.utils;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.*;
import org.openqa.selenium.edge.*;
import java.time.Duration;
import java.util.List;

public final class DriverFactory {
    private DriverFactory() {}
    public static WebDriver create() {
        String browser = System.getProperty("browser", "edge");
        boolean headless = Boolean.parseBoolean(System.getProperty("headless", "true"));
        List<String> arguments = new java.util.ArrayList<>(List.of("--window-size=1440,1000", "--lang=vi", "--disable-dev-shm-usage"));
        if (headless) arguments.add("--headless=new");
        String binary = System.getenv("SELENIUM_BROWSER_BINARY");
        WebDriver driver;
        switch (browser) {
            case "chrome" -> {
                ChromeOptions options = new ChromeOptions(); options.addArguments(arguments);
                if (binary != null) options.setBinary(binary);
                driver = new ChromeDriver(options);
            }
            case "edge" -> {
                EdgeOptions options = new EdgeOptions(); options.addArguments(arguments);
                if (binary != null) options.setBinary(binary);
                driver = new EdgeDriver(options);
            }
            default -> throw new IllegalArgumentException("browser must be chrome or edge");
        }
        driver.manage().timeouts().implicitlyWait(Duration.ZERO);
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(60));
        return driver;
    }
}
