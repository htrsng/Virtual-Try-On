package com.vfitai.qa.pages;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.*;
import java.time.Duration;

abstract class BasePage {
    protected final WebDriver driver;
    protected final WebDriverWait wait;
    BasePage(WebDriver driver) { this.driver = driver; wait = new WebDriverWait(driver, Duration.ofSeconds(25)); }
    protected WebElement visible(By locator) { return wait.until(ExpectedConditions.visibilityOfElementLocated(locator)); }
    protected void click(By locator) {
        click(d -> d.findElement(locator));
    }
    protected void click(java.util.function.Function<WebDriver, WebElement> locate) {
        wait.until(d -> {
            try {
                WebElement element = locate.apply(d);
                if (element == null) return false;
                if (!element.isDisplayed() || !element.isEnabled()) return false;
                ((JavascriptExecutor)d).executeScript("arguments[0].scrollIntoView({block:'center',behavior:'instant'})", element);
                element.click(); return true;
            } catch (StaleElementReferenceException | ElementClickInterceptedException | NoSuchElementException e) { return false; }
        });
    }
}
