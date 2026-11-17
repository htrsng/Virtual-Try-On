package com.vfitai.qa.pages;
import org.openqa.selenium.*;

public final class CheckoutPage extends BasePage {
    public CheckoutPage(WebDriver driver) { super(driver); }
    public String selectedProduct() {
        click(d -> d.findElements(By.cssSelector(".co-summary button")).stream().filter(e -> e.getText().contains("(1)")).findFirst().orElse(null));
        return visible(By.cssSelector(".co-mini-product")).getText();
    }
    public int selectedCount() { return driver.findElements(By.cssSelector(".co-mini-product")).size(); }
    public void shipping(String method) { click(By.cssSelector(".shipping-option:has(input[value='" + method + "'])")); }
    public void coupon(String code) {
        visible(By.cssSelector(".discount-input")).sendKeys(code); click(By.cssSelector(".apply-btn"));
        visible(By.cssSelector(".discount-success"));
    }
    public long total() { return Long.parseLong(visible(By.cssSelector(".co-summary__total-price")).getText().replaceAll("[^0-9]", "")); }
    public void placeOrder() {
        visible(By.cssSelector(".addr-name")); click(By.cssSelector(".checkout-btn"));
        click(By.cssSelector(".confirm-modal .confirm-btn-primary"));
    }
    public String error() { return visible(By.cssSelector(".toast-error .toast-message")).getText(); }
}
