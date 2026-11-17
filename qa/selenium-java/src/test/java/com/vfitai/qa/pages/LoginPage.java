package com.vfitai.qa.pages;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;

public final class LoginPage extends BasePage {
    private WebElement submittedDocument;
    public LoginPage(WebDriver driver) { super(driver); }
    public LoginPage open(String base) { driver.get(base + "/login"); visible(By.cssSelector("input[type=email]")); return this; }
    public void submit(String email, String password) {
        submittedDocument = driver.findElement(By.tagName("html"));
        visible(By.cssSelector("input[type=email]")).sendKeys(email);
        visible(By.cssSelector("input[type=password]")).sendKeys(password);
        click(By.cssSelector("button.modern-submit-btn"));
    }
    public String error() { return visible(By.cssSelector(".toast-error .toast-message")).getText(); }
    public void awaitHome(String base) {
        // Login currently schedules a full reload after the React redirect.
        wait.until(ExpectedConditions.stalenessOf(submittedDocument));
        wait.until(ExpectedConditions.urlToBe(base + "/"));
        visible(By.cssSelector("a[href='/product/50101']"));
    }
    public boolean hasSession() { return Boolean.TRUE.equals(((JavascriptExecutor)driver).executeScript("return !!localStorage.getItem('token')")); }
    public String sessionToken() { return (String)((JavascriptExecutor)driver).executeScript("return localStorage.getItem('token')"); }
}
