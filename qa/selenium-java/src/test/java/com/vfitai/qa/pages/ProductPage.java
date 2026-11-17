package com.vfitai.qa.pages;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;

public final class ProductPage extends BasePage {
    public ProductPage(WebDriver driver) { super(driver); }
    public ProductPage openFromHome(String base) {
        driver.get(base + "/"); click(By.cssSelector("a[href='/product/50101']"));
        visible(By.cssSelector(".product-detail-title")); return this;
    }
    public String title() { return visible(By.cssSelector(".product-detail-title")).getText(); }
    public void addMedium() {
        click(d -> d.findElements(By.cssSelector("button.size-btn")).stream().filter(e -> e.getText().trim().equals("M")).findFirst().orElse(null));
        click(By.cssSelector(".action-btn.primary"));
        wait.until(d -> Boolean.TRUE.equals(((JavascriptExecutor)d).executeScript("return JSON.parse(localStorage.getItem('cartItems') || '[]').length === 1")));
    }
}
