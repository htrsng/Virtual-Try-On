package com.vfitai.qa.pages;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;

public final class CartPage extends BasePage {
    private final By checkout = By.cssSelector(".cp-checkout-btn");
    public CartPage(WebDriver driver) { super(driver); }
    public CartPage open(String base) { driver.get(base + "/cart"); visible(checkout); return this; }
    public boolean checkoutEnabled() { return visible(checkout).isEnabled(); }
    public void selectAll() { click(By.cssSelector("label.cp-checkbox-label")); wait.until(d -> d.findElement(checkout).isEnabled()); }
    public void checkout() { click(checkout); wait.until(ExpectedConditions.urlContains("/checkout/cart")); }
}
