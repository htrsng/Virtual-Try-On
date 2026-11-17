package com.vfitai.qa.pages;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;

public final class Header extends BasePage {
    public Header(WebDriver driver) { super(driver); }
    public void logout() {
        click(By.cssSelector(".user-menu-trigger")); click(By.cssSelector(".user-menu-item.logout"));
        wait.until(d -> ((JavascriptExecutor)d).executeScript("return localStorage.getItem('token')") == null);
    }
    public void search(String query) {
        var input = visible(By.cssSelector(".search-input")); input.clear(); input.sendKeys(query);
        click(By.cssSelector(".search-btn")); wait.until(ExpectedConditions.urlContains("/search?q="));
    }
}
